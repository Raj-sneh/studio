from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import uuid
import os
import subprocess
import librosa
import numpy as np
import soundfile as sf
import base64

# 1. Initialize environment
load_dotenv()

app = FastAPI()

# 2. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Setup Temp Folder
UPLOAD_FOLDER = "temp_audio"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.mount("/temp_audio", StaticFiles(directory=UPLOAD_FOLDER), name="temp_audio")

# 4. Initialize AI Client
API_KEY = os.getenv("ELEVENLABS_API_KEY")
elevenlabs = ElevenLabs(api_key=API_KEY)

@app.get("/")
def home():
    return {"status": "Sargam AI Voice Engine is active"}

@app.post("/tts")
async def tts(text: str = Form(...)):
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
    """Separates vocals from background music using HPSS."""
    try:
        task_id = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_input.wav")
        
        with open(input_path, "wb") as buffer:
            buffer.write(await audio.read())

        # Load audio
        y, sr = librosa.load(input_path, sr=None)

        # Harmonic-Percussive Source Separation (HPSS)
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        vocals_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_vocals.wav")
        bgm_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_bgm.wav")

        sf.write(vocals_path, y_harmonic, sr)
        sf.write(bgm_path, y_percussive, sr)

        # Convert to base64 for the frontend
        with open(vocals_path, "rb") as f:
            vocals_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(bgm_path, "rb") as f:
            bgm_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Cleanup
        os.remove(input_path)
        os.remove(vocals_path)
        os.remove(bgm_path)

        return {
            "vocals": f"data:audio/wav;base64,{vocals_b64}",
            "bgm": f"data:audio/wav;base64,{bgm_b64}"
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/mix")
async def mix(vocals: UploadFile = File(...), bgm: UploadFile = File(...)):
    """Mixes two audio tracks using FFmpeg."""
    try:
        task_id = str(uuid.uuid4())
        v_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_v.wav")
        b_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_b.wav")
        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp3")

        with open(v_path, "wb") as v_buf:
            v_buf.write(await vocals.read())
        with open(b_path, "wb") as b_buf:
            b_buf.write(await bgm.read())

        # FFmpeg Mixing Command
        subprocess.run([
            "ffmpeg", "-y", "-i", v_path, "-i", b_path,
            "-filter_complex", "amix=inputs=2:duration=longest",
            "-ac", "2", out_path
        ], check=True)

        return FileResponse(out_path, media_type="audio/mpeg")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        # Final cleanup should happen after response, handled by OS/Cron in prod
        pass

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 so IDX can route traffic to it
    uvicorn.run(app, host="0.0.0.0", port=10000)