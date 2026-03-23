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
# Mapping codes to their credit values
# These are now tracked per user in the 'user_redemptions' store
coupon_values = {
    "S49A1B2": 100,
    "MELODY100": 100,
    "SKVPRO49": 100,
    "TUNE7K2L": 100,
    "BEAT49X1": 100,
    "MAX@250#₹": 250,
    "PRO#SKV@₹99": 250,
    "GOLD₹@MAX#": 250,
    "VIP#99@₹250": 250,
    "ULTRA@₹#99": 250
}

# In-memory store for tracking: { "user_id": ["code1", "code2"] }
user_redemptions = {}

@app.route('/')
def home():
    return "Sargam AI Voice Backend Running"

@app.route('/redeem', methods=['POST'])
def redeem_coupon():
    try:
        code = request.form.get("code")
        user_id = request.form.get("userId")
        
        if not code:
            return jsonify({"status": "invalid", "message": "No code provided"}), 400
        
        if not user_id:
            return jsonify({"status": "invalid", "message": "User context missing"}), 400
        
        if code not in coupon_values:
            return jsonify({"status": "invalid", "message": "Invalid coupon code"}), 404

        # Initialize user history if not exists
        if user_id not in user_redemptions:
            user_redemptions[user_id] = []

        # Check if THIS user has used THIS code
        if code in user_redemptions[user_id]:
            return jsonify({"status": "used", "message": "You have already redeemed this coupon"}), 400

        credits_to_add = coupon_values[code]
        
        # Record this redemption for the user
        user_redemptions[user_id].append(code)

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
