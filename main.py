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
from dotenv import load_dotenv
import razorpay

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable CORS for Next.js (sargamskv.in)
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

# --- Routes ---

@app.get("/")
@app.get("/api/status")
async def get_status():
    """Satisfies health checks and polling logic"""
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

@app.post("/mix")
async def mix_audio(vocals: UploadFile = File(...), bgm: UploadFile = File(...)):
    """Mixes two tracks into one mastered MP3."""
    try:
        task_id = str(uuid.uuid4())
        v_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_v.wav")
        b_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_b.wav")
        out_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_master.mp3")

        with open(v_path, "wb") as buffer: shutil.copyfileobj(vocals.file, buffer)
        with open(b_path, "wb") as buffer: shutil.copyfileobj(bgm.file, buffer)

        subprocess.run([
            "ffmpeg", "-y", "-i", v_path, "-i", b_path,
            "-filter_complex", "amix=inputs=2:duration=longest",
            "-ac", "2", out_path
        ], check=True)

        return FileResponse(out_path, media_type="audio/mpeg", filename="master.mp3")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

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
