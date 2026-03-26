from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import uuid
import os

# Initialize environment
load_dotenv()

app = FastAPI()

# Enable CORS for the frontend to access this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("ELEVENLABS_API_KEY")
elevenlabs = ElevenLabs(api_key=API_KEY)

@app.get("/")
def home():
    return {"status": "Backend is running"}

@app.post("/clone")
def clone():
    return {"status": "clone working"}

@app.post("/separate")
def separate_audio():
    """Endpoint for basic vocal/bgm separation."""
    return {"vocals": "dummy_vocals_url", "bgm": "dummy_bgm_url"}

@app.post("/clone/separate")
async def separate():
    """Requested endpoint for cloning-related separation logic."""
    return {
        "vocals": "dummy",
        "bgm": "dummy"
    }

@app.post("/tts")
async def tts(text: str = Form(...)):
    """High-fidelity Text-to-Speech using ElevenLabs."""
    if not text:
        return {"error": "Enter text"}

    if len(text) > 200:
        return {"error": "Text too long"}

    try:
        audio = elevenlabs.text_to_speech.convert(
            text=text,
            voice_id="JBFqnCBsd6RMkjVDRZzb", # Default studio voice
            model_id="eleven_v3",
            output_format="mp3_44100_128",
        )

        filename = f"{uuid.uuid4()}.mp3"

        with open(filename, "wb") as f:
            for chunk in audio:
                f.write(chunk)

        return FileResponse(filename, media_type="audio/mpeg")
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
