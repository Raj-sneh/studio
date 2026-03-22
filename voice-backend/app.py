from flask import Flask, 
request, send_file, 
jsonify from flask_cors 
import CORS from TTS.api 
import TTS import os app = 
Flask(__name__) CORS(app) 
print("Loading model... 
wait") tts = 
TTS("tts_models/multilingual/multi-dataset/xtts_v2", 
gpu=False) @app.route('/') 
def home():
    return "Voice cloning 
    backend running"
@app.route('/clone', 
methods=['POST']) def 
clone():
    try: text = 
        request.form.get("text") 
        audio = 
        request.files.get("voice") 
        if not text or not 
        audio:
            return 
            jsonify({"error": 
            "Missing text 
            or voice 
            sample"}), 400
        # Save voice 
        # sample
        sample_path = 
        "sample.wav" 
        audio.save(sample_path) 
        output_path = 
        "output.wav"
        # REAL voice 
        # cloning
        tts.tts_to_file( 
            text=text, 
            speaker_wav=sample_path, 
            language="en", 
            file_path=output_path
        ) return 
        send_file(output_path, 
        mimetype="audio/wav")
    except Exception as e: 
        return 
        jsonify({"error": 
        str(e)}), 500
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
