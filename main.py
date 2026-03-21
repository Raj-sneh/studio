from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.api import TTS
import os

app = Flask(__name__)
CORS(app)

# Load model once at startup to avoid crashing during requests
# XTTS v2 is ~2GB and needs significant RAM to load
print("Loading XTTS v2 model... please wait.")
# Use gpu=True if running in an environment with a GPU (like the one defined in service.yaml)
try:
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
except Exception as e:
    print(f"Error loading model: {e}")
    tts = None

@app.route('/clone', methods=['POST'])
def clone_voice():
    if tts is None:
        return jsonify({"error": "TTS model not loaded on server"}), 500
        
    # 1. Validate incoming data
    if 'text' not in request.form or 'sample' not in request.files:
        return jsonify({"error": "Missing 'text' or 'sample' audio file"}), 400
    
    text = request.form['text']
    audio_file = request.files['sample']
    
    # 2. Save reference audio temporarily
    sample_path = "user_voice_ref.wav"
    audio_file.save(sample_path)
    
    # 3. Generate cloned audio (Zero-shot cloning)
    output_path = "cloned_voice_output.wav"
    try:
        tts.tts_to_file(
            text=text,
            speaker_wav=sample_path,
            language="en",
            file_path=output_path
        )
        return send_file(output_path, mimetype="audio/wav")
    except Exception as e:
        print(f"Cloning error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temporary file
        if os.path.exists(sample_path):
            os.remove(sample_path)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": tts is not None})

if __name__ == '__main__':
    # Running on 8080 as per service.yaml
    app.run(host='0.0.0.0', port=8080)
