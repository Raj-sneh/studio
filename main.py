from fastapi import FastAPI, Form
from fastapi.responses import FileResponse
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
import uuid
import os

load_dotenv()

app = FastAPI()

API_KEY = os.getenv("ELEVENLABS_API_KEY")

elevenlabs = ElevenLabs(api_key=API_KEY)

@app.post("/tts")
async def tts(text: str = Form(...)):

    if not text:
        return {"error": "Enter text"}

    if len(text) > 200:
        return {"error": "Text too long"}

    audio = elevenlabs.text_to_speech.convert(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_v3",
        output_format="mp3_44100_128",
    )

    filename = f"{uuid.uuid4()}.mp3"

    with open(filename, "wb") as f:
        for chunk in audio:
            f.write(chunk)

    return FileResponse(filename, media_type="audio/mpeg")