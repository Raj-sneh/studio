from fastapi import FastAPI, Request, HTTPException, Response, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac
import hashlib
import os
import json
import uuid
import shutil
import subprocess
import librosa
import numpy as np
import soundfile as sf
import base64
import io
from dotenv import load_dotenv
import razorpay
from pedalboard import Pedalboard, Compressor, Gain, HighpassFilter, Limiter
import noisereduce as nr

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Initialization ---
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception:
        firebase_admin.initialize_app(options={
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT', 'studio-4164192500-df01a')
        })

db = firestore.client()

# --- Razorpay Initialization ---
rzp_key = os.environ.get("RAZORPAY_KEY_ID")
rzp_secret = os.environ.get("RAZORPAY_KEY_SECRET")
client = razorpay.Client(auth=(rzp_key, rzp_secret)) if rzp_key and rzp_secret else None

# --- Temp Folder for Audio ---
UPLOAD_FOLDER = 'temp_audio'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Studio Magic Logic ---

def apply_studio_magic(audio_bytes):
    # 1. Load the AI voice
    with io.BytesIO(audio_bytes) as f:
        audio, sample_rate = sf.read(f)

    # 2. Advanced Noise Reduction (Removes background hum/hiss)
    # Reduces "cracking" sounds in the silent parts
    reduced_noise = nr.reduce_noise(y=audio, sr=sample_rate)

    # 3. Professional Studio Rack (Autotune-style clarity)
    board = Pedalboard([
        # Remove low-end rumble
        HighpassFilter(cutoff_frequency_hz=100), 
        # Smooth out volume peaks (Stops digital cracking/clipping)
        Compressor(threshold_db=-16, ratio=4), 
        # Add a bit of "Warmth"
        Gain(gain_db=2), 
        # The Safety Net: Stops the audio from ever "cracking"
        Limiter(threshold_db=-0.5) 
    ])

    # 4. Process the audio
    mastered = board(reduced_noise, sample_rate)

    # 5. Export back to bytes
    out_f = io.BytesIO()
    sf.write(out_f, mastered, sample_rate, format='wav')
    return out_f.getvalue()

# --- Routes ---

@app.get("/")
@app.get("/api/status")
@app.head("/")
async def home():
    return {"status": "Sargam Neural Engine Active", "ready": True, "engine": "FastAPI"}

@app.post("/separate")
async def separate_audio(audio: UploadFile = File(...)):
    """Separates vocals from background music using HPSS logic."""
    try:
        task_id = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_input.wav")
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # Load and process
        y, sr = librosa.load(input_path, sr=None)
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

        return {
            "vocals": f"data:audio/wav;base64,{vocals_b64}",
            "bgm": f"data:audio/wav;base64,{bgm_b64}"
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/mix")
@app.post("/mix")
async def mix_audio(request: Request):
    try:
        form = await request.form()
        vocals_file = form.get("vocals") # The voice from ElevenLabs
        
        if not vocals_file:
            return JSONResponse(status_code=400, content={"error": "Missing vocals file"})

        v_bytes = await vocals_file.read()
        
        # APPLY THE PRO FIXES HERE
        pro_vocals = apply_studio_magic(v_bytes)
        
        return Response(content=pro_vocals, media_type="audio/wav")
    except Exception as e:
        print(f"PRO MASTERING ERROR: {e}")
        return JSONResponse(status_code=500, content={"error": "Studio processing failed"})

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        doc_snap = user_ref.get()
        if doc_snap.exists:
            return doc_snap.to_dict()
        else:
            new_user = {"id": user_id, "credits": 10, "plan": "free", "redeemedCoupons": []}
            user_ref.set(new_user)
            return new_user
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Database retrieval failed"})

@app.post("/api/credits/use")
async def use_credits(request: Request):
    try:
        data = await request.json()
        user_id = data.get("user_id")
        amount = int(data.get("amount", 0))
        
        if not user_id: raise Exception("Missing user_id")
        
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def update_in_transaction(transaction, user_ref):
            snapshot = user_ref.get(transaction=transaction)
            user_data = snapshot.to_dict()
            if not user_data: raise Exception("User profile missing")
            
            current = user_data.get('credits', 0)
            if current < amount: raise Exception(f"Insufficient credits. Need {amount}, have {current}.")
            
            transaction.update(user_ref, {'credits': current - amount})
            return current - amount

        new_bal = update_in_transaction(db.transaction(), user_ref)
        return {"success": True, "remaining": new_bal}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/webhook/elevenlabs")
async def elevenlabs_webhook(request: Request):
    """Secure webhook for ElevenLabs events."""
    webhook_secret = os.environ.get("ELEVENLABS_WEBHOOK_SECRET")
    signature = request.headers.get("X-ElevenLabs-Signature")
    body = await request.body()

    if webhook_secret and signature:
        mac = hmac.new(webhook_secret.encode(), msg=body, digestmod=hashlib.sha256)
        expected = mac.hexdigest()
        if not hmac.compare_digest(expected, signature):
            return JSONResponse(status_code=401, content={"error": "Invalid signature"})

    data = await request.json()
    print(f"SKV AI: ElevenLabs Webhook: {data.get('status')}")
    return {"status": "ok"}

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    try:
        data = await request.json()
        user_id, code = data.get("userId"), data.get("code", "").upper().strip()
        
        coupons = { "SKV-PRO-1": 1000, "WELCOME-SARGAM": 50, "RESEARCH-TEST": 500 }
        
        if code not in coupons:
            return JSONResponse(status_code=404, content={"error": "Invalid or expired coupon code."})
            
        credits_to_add = coupons[code]
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def add_credits(transaction, user_ref):
            snap = user_ref.get(transaction=transaction)
            u_data = snap.to_dict() or {}
            redeemed = u_data.get('redeemedCoupons', [])
            
            if code in redeemed: raise Exception("Coupon already redeemed.")
            
            current = u_data.get('credits', 0)
            transaction.update(user_ref, {
                'credits': current + credits_to_add,
                'redeemedCoupons': firestore.ArrayUnion([code]),
                'plan': 'creator' if credits_to_add >= 500 else u_data.get('plan', 'free')
            })
            return current + credits_to_add

        add_credits(db.transaction(), user_ref)
        return {"status": "success", "credits": credits_to_add}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
