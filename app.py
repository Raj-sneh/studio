from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import subprocess
import librosa
import numpy as np
import soundfile as sf
import uuid

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'temp_audio'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def home():
    return "Sargam AI Voice Engine Running"

@app.route('/separate', methods=['POST'])
def separate():
    """Separates vocals from background music using HPSS."""
    try:
        audio = request.files.get("audio")
        if not audio:
            return jsonify({"error": "No audio provided"}), 400

        task_id = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_input.wav")
        audio.save(input_path)

        # Load audio
        y, sr = librosa.load(input_path, sr=None)

        # Harmonic-Percussive Source Separation (HPSS)
        # In a real studio environment, this would be Spleeter or Demucs, 
        # but HPSS is a solid library-native proxy for spectral separation.
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        vocals_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_vocals.wav")
        bgm_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_bgm.wav")

        sf.write(vocals_path, y_harmonic, sr)
        sf.write(bgm_path, y_percussive, sr)

        # Convert to data URIs or just return paths for internal use
        # For this prototype, we return the audio files in a single zip or base64
        # But to keep it simple for the Next.js flow, we return base64
        import base64
        with open(vocals_path, "rb") as f:
            vocals_b64 = base64.b64encode(f.read()).decode('utf-8')
        with open(bgm_path, "rb") as f:
            bgm_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Cleanup
        os.remove(input_path)
        os.remove(vocals_path)
        os.remove(bgm_path)

        return jsonify({
            "vocals": f"data:audio/wav;base64,{vocals_b64}",
            "bgm": f"data:audio/wav;base64,{bgm_b64}"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/mix', methods=['POST'])
def mix():
    """Mixes two audio tracks (Vocals + BGM) into one master track."""
    try:
        vocals = request.files.get("vocals")
        bgm = request.files.get("bgm")

        if not vocals or not bgm:
            return jsonify({"error": "Missing components for mixing"}), 400

        task_id = str(uuid.uuid4())
        v_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_v.wav")
        b_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_b.wav")
        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp3")

        vocals.save(v_path)
        bgm.save(b_path)

        # Use FFmpeg to mix and normalize
        # -filter_complex amix: combine
        # -ac 2: stereo
        subprocess.run([
            "ffmpeg", "-y", "-i", v_path, "-i", b_path,
            "-filter_complex", "amix=inputs=2:duration=longest",
            "-ac", "2", out_path
        ], check=True)

        return send_file(out_path, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup occurs after send_file in a real app, but for now:
        pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
