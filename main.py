from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.api import TTS
import os

app = Flask(__name__)
CORS(app)

print("Loading model... wait")
# Using xtts_v2 as the actual model path for functionality
try:
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
except Exception as e:
    print(f"Error loading model: {e}")
    tts = None

@app.route('/')
def home():
    return "Voice cloning backend running"

@app.route('/clone', methods=['POST'])
def clone():
    if tts is None:
        return jsonify({"error": "TTS model not loaded"}), 500
        
    try:
        text = request.form.get("text")
        audio = request.files.get("audio")

        if not text or not audio:
            return jsonify({"error": "Missing text or voice sample"}), 400

        sample_path = "sample.wav"
        audio.save(sample_path)

        output_path = "output.wav"

        tts.tts_to_file(
            text=text,
            speaker_wav=sample_path,
            language="en",
            file_path=output_path
        )

        return send_file(
            output_path,
            mimetype="audio/wav",
            as_attachment=True,
            download_name="output.wav"
        )

    except Exception as e:
        print(f"Cloning error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists("sample.wav"):
            os.remove("sample.wav")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)