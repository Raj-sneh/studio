from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import subprocess
import librosa
import numpy as np
import soundfile as sf
import uuid
import base64

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

UPLOAD_FOLDER = 'temp_audio'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
@app.route('/health')
def health():
    """Health check for the neural engine."""
    return jsonify({"ready": True, "status": "Sargam Neural Engine Active", "engine": "Flask"})

@app.route('/api/status')
def api_status():
    """Standardized status check for the neural engine."""
    return jsonify({"ready": True, "status": "Sargam Neural Engine Active", "engine": "Flask"})

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
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        vocals_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_vocals.wav")
        bgm_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_bgm.wav")

        sf.write(vocals_path, y_harmonic, sr)
        sf.write(bgm_path, y_percussive, sr)

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
        subprocess.run([
            "ffmpeg", "-y", "-i", v_path, "-i", b_path,
            "-filter_complex", "amix=inputs=2:duration=longest",
            "-ac", "2", out_path
        ], check=True)

        return send_file(out_path, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stitch', methods=['POST'])
def stitch():
    """Stitches multiple base64 videos into one master MP4."""
    try:
        data = request.json
        videos_b64 = data.get("videos", [])
        if not videos_b64:
            return jsonify({"error": "No video clips provided for stitching."}), 400

        task_id = str(uuid.uuid4())
        video_paths = []

        # Save clips
        for i, v_b64 in enumerate(videos_b64):
            path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{i}.mp4")
            with open(path, "wb") as f:
                # Remove data uri prefix if present
                content = v_b64.split(",")[1] if "," in v_b64 else v_b64
                f.write(base64.b64decode(content))
            video_paths.append(path)

        # Create concat file
        list_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_list.txt")
        with open(list_path, "w") as f:
            for p in video_paths:
                f.write(f"file '{os.path.abspath(p)}'\n")

        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp4")
        
        # Concatenate without re-encoding for speed (assumes same resolution/codec)
        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_path,
            "-c", "copy", out_path
        ], check=True)

        with open(out_path, "rb") as f:
            res_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Cleanup
        for p in video_paths: os.remove(p)
        os.remove(list_path)
        os.remove(out_path)

        return jsonify({"video": f"data:video/mp4;base64,{res_b64}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)