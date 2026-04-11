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
    """Stitches multiple base64 videos into one master MP4 using robust re-encoding."""
    task_id = str(uuid.uuid4())
    video_paths = []
    
    try:
        data = request.json
        videos_b64 = data.get("videos", [])
        if not videos_b64:
            return jsonify({"error": "No video clips provided for stitching."}), 400

        # Save clips locally for processing
        for i, v_b64 in enumerate(videos_b64):
            path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{i}.mp4")
            with open(path, "wb") as f:
                content = v_b64.split(",")[1] if "," in v_b64 else v_b64
                f.write(base64.b64decode(content))
            video_paths.append(path)

        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp4")
        
        # Robust re-encoding concatenation (handles metadata/param mismatches)
        # We scale all inputs to 720p to ensure compatibility during the concat filter
        filter_str = "".join([f"[{i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}];" for i in range(len(video_paths))])
        # Note: We use 'anullsrc' if audio is missing, but here we assume silent/consistent audio if any
        # For simplicity in this neural context, we concat the video streams
        filter_str += "".join([f"[v{i}]" for i in range(len(video_paths))])
        filter_str += f"concat=n={len(video_paths)}:v=1:a=0[outv]"
        
        cmd = ["ffmpeg", "-y"]
        for p in video_paths:
            cmd.extend(["-i", p])
        
        cmd.extend([
            "-filter_complex", filter_str,
            "-map", "[outv]",
            "-c:v", "libx264", 
            "-preset", "ultrafast", 
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            out_path
        ])

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"FFmpeg Error: {result.stderr}")

        with open(out_path, "rb") as f:
            res_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Immediate Cleanup
        for p in video_paths: 
            if os.path.exists(p): os.remove(p)
        if os.path.exists(out_path): os.remove(out_path)

        return jsonify({"video": f"data:video/mp4;base64,{res_b64}"})

    except Exception as e:
        # Cleanup on failure
        for p in video_paths: 
            if os.path.exists(p): os.remove(p)
        return jsonify({"error": f"Neural Stitching Failed: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)