from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import os
import wave
import audioop
import subprocess
import librosa
import numpy as np

app = Flask(__name__)
CORS(app)

# 🎫 COUPON DATABASE
# ₹49 -> 100 Credits (Alphanumeric)
# ₹99 -> 250 Credits (Alphanumeric + @, #, ₹)
coupons = {
    "S49A1B2": {"credits": 100, "used": False},
    "MELODY100": {"credits": 100, "used": False},
    "SKVPRO49": {"credits": 100, "used": False},
    "TUNE7K2L": {"credits": 100, "used": False},
    "BEAT49X1": {"credits": 100, "used": False},
    "MAX@250#₹": {"credits": 250, "used": False},
    "PRO#SKV@₹99": {"credits": 250, "used": False},
    "GOLD₹@MAX#": {"credits": 250, "used": False},
    "VIP#99@₹250": {"credits": 250, "used": False},
    "ULTRA@₹#99": {"credits": 250, "used": False}
}

@app.route('/')
def home():
    return "Sargam AI Voice Backend Running"

@app.route('/redeem', methods=['POST'])
def redeem_coupon():
    try:
        code = request.form.get("code")
        
        if not code:
            return jsonify({"status": "invalid", "message": "No code provided"}), 400
        
        if code not in coupons:
            return jsonify({"status": "invalid", "message": "Invalid coupon code"}), 404

        if coupons[code]["used"]:
            return jsonify({"status": "used", "message": "This coupon has already been redeemed"}), 400

        credits_to_add = coupons[code]["credits"]
        
        # Mark as used in this session
        coupons[code]["used"] = True

        return jsonify({
            "status": "success",
            "credits": credits_to_add
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/clone', methods=['POST'])
def clone():
    try:
        text = request.form.get("text")
        audio = request.files.get("audio")

        if not text or not audio:
            return jsonify({"error": "Missing text or audio"}), 400

        input_path = "input_audio"
        audio.save(input_path)

        wav_path = "converted.wav"

        result = subprocess.run(
            ["ffmpeg", "-y", "-i", input_path, wav_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        if result.returncode != 0:
            return jsonify({"error": "Audio conversion failed"}), 500

        try:
            with wave.open(wav_path, 'rb') as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                duration = frames / float(rate)
                frames_data = wf.readframes(frames)
                energy = audioop.rms(frames_data, wf.getsampwidth())
        except:
            duration = 3
            energy = 1500

        try:
            y, sr = librosa.load(wav_path)
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = pitches[magnitudes > np.median(magnitudes)]
            pitch = np.mean(pitch_values) if len(pitch_values) > 0 else 150
        except:
            pitch = 150

        if duration > 5:
            slow = True
        else:
            slow = False

        if energy > 3000:
            slow = False
        elif energy < 1200:
            slow = True

        if pitch > 200:
            slow = False
        elif pitch < 120:
            slow = True

        output_path = "output.mp3"
        tts = gTTS(text=text, slow=slow)
        tts.save(output_path)

        return send_file(
            output_path,
            mimetype="audio/mpeg",
            as_attachment=True,
            download_name="output.mp3"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        for f in ["input_audio", "converted.wav"]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)