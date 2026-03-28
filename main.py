
import os
import sys
import uuid
import subprocess
import base64
import argparse
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# 1. Robust module loading system
# We catch ImportErrors to prevent the server from crashing during background installation
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("WARNING: 'python-dotenv' not found. Environment variables must be set manually.")
    load_dotenv = None

try:
    import librosa
    import numpy as np
    import soundfile as sf
except ImportError:
    print("WARNING: 'librosa' or 'soundfile' not found. Neural features will be unavailable.")
    librosa = None

try:
    from elevenlabs.client import ElevenLabs
except ImportError:
    print("WARNING: 'elevenlabs' not found. Voice synthesis will be unavailable.")
    ElevenLabs = None

# 2. Argument Parsing
parser = argparse.ArgumentParser(description="Sargam AI Voice Engine")
parser.add_argument("--port", type=int, default=1000, help="Port to run the server on")
parser.add_argument("--hostname", type=str, default="0.0.0.0", help="Hostname to bind the server to")
args, unknown = parser.parse_known_args()

app = FastAPI()

# 3. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Setup Temp Folder
UPLOAD_FOLDER = "temp_audio"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.mount("/temp_audio", StaticFiles(directory=UPLOAD_FOLDER), name="temp_audio")

# 5. Initialize AI Client
API_KEY = os.getenv("ELEVENLABS_API_KEY")
elevenlabs = ElevenLabs(api_key=API_KEY) if ElevenLabs and API_KEY else None

@app.get("/")
def home():
    return {
        "status": "Sargam AI Voice Engine is active", 
        "port": 9002,
        "elevenlabs_active": elevenlabs is not None,
        "librosa_active": librosa is not None
    }

@app.post("/tts")
async def tts(text: str = Form(...)):
    if not elevenlabs:
        return {"error": "ElevenLabs client not initialized. Check installation status."}
    if not text:
        return {"error": "Enter text"}
    try:
        audio = elevenlabs.text_to_speech.convert(
            text=text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128",
        )

        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        with open(filepath, "wb") as f:
            for chunk in audio:
                f.write(chunk)

        return {"audio_url": f"/temp_audio/{filename}"}

    except Exception as e:
        return {"error": str(e)}

@app.post("/clone/separate")
async def separate(audio: UploadFile = File(...)):
    """Separates vocals from background music."""
    if not librosa:
        return JSONResponse(status_code=503, content={"error": "Neural engine is still initializing. Please try again in 30 seconds."})
    
    try:
        task_id = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_input.wav")
        
        with open(input_path, "wb") as buffer:
            buffer.write(await audio.read())

        y, sr = librosa.load(input_path, sr=None)
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        vocals_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_vocals.wav")
        bgm_path_wav = os.path.join(UPLOAD_FOLDER, f"{task_id}_bgm.wav")

        sf.write(vocals_path, y_harmonic, sr)
        sf.write(bgm_path_wav, y_percussive, sr)

        with open(vocals_path, "rb") as f:
            vocals_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(bgm_path_wav, "rb") as f:
            bgm_b64 = base64.b64encode(f.read()).decode('utf-8')

        os.remove(input_path)
        os.remove(vocals_path)
        os.remove(bgm_path_wav)

        return {
            "vocals": f"data:audio/wav;base64,{vocals_b64}",
            "bgm": f"data:audio/wav;base64,{bgm_b64}"
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/mix")
async def mix(vocals: UploadFile = File(...), bgm: UploadFile = File(...)):
    """Mixes audio tracks."""
    try:
        task_id = str(uuid.uuid4())
        v_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_v.wav")
        b_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_b.wav")
        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp3")

        with open(v_path, "wb") as v_buf:
            v_buf.write(await vocals.read())
        with open(b_path, "wb") as b_buf:
            b_buf.write(await bgm.read())

        subprocess.run([
            "ffmpeg", "-y", "-i", v_path, "-i", b_path,
            "-filter_complex", "amix=inputs=2:duration=longest",
            "-ac", "2", out_path
        ], check=True)

        return FileResponse(out_path, media_type="audio/mpeg")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Respect the requested port 1000
    port = int(os.getenv("PORT", args.port))
    host = args.hostname
    print(f"Starting Sargam Voice Engine on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
