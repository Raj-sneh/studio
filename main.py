from fastapi import FastAPI, Form
from fastapi.responses import FileResponse
from elevenlabs.client import ElevenLabs
import uuid
import os

app = FastAPI()

# 🔥 Load API Key from environment or paste it here
elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY", "sk_0f3ff9dd46e41cb38a5442ac52e1371eb58711c4a4893975")
)

# 🔥 Dummy credit system (change later)
credits_store = {
    "user1": 10
}

@app.post("/tts")
async def tts(text: str = Form(...), user_id: str = Form(...)):

    # ❌ Empty text check
    if not text:
        return {"error": "Enter text"}

    # ❌ Limit text length (VERY IMPORTANT)
    if len(text) > 200:
        return {"error": "Text too long"}

    # ❌ Credit check
    if credits_store.get(user_id, 0) <= 0:
        return {"error": "No credits left"}

    # 🔥 Deduct credit
    credits_store[user_id] -= 1

    # 🔥 Generate audio
    audio = elevenlabs.text_to_speech.convert(
        text=text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",  # default voice
        model_id="eleven_v3",
        output_format="mp3_44100_128",
    )

    # 🔥 Save file
    filename = f"{uuid.uuid4()}.mp3"

    with open(filename, "wb") as f:
        for chunk in audio:
            f.write(chunk)

    # 🔥 Return audio
    return FileResponse(filename, media_type="audio/mpeg")
