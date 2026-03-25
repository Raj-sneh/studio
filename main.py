from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from elevenlabs.client import ElevenLabs
from dotenv import load_dotenv
from pyngrok import ngrok
import uuid
import os

# Initialize environment
load_dotenv()

# Start ngrok tunnel on port 8000
# Note: Ensure NGROK_AUTHTOKEN is set in your environment if required
try:
    public_url = ngrok.connect(8000)
    print("🔥 PUBLIC URL:", public_url)
except Exception as e:
    print("⚠️ ngrok failed to start. Ensure your NGROK_AUTHTOKEN is set or run manually.")
    print(f"Error: {e}")

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

@app.post("/tts")
async def tts(text: str = Form(...)):

    if not text:
        return {"error": "Enter text"}

    if len(text) > 200:
        return {"error": "Text too long"}

    try:
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
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
