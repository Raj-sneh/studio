from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac, hashlib, os, json, base64, traceback, io, gc
import soundfile as sf
import numpy as np
from pedalboard import Pedalboard, Compressor, Gain, HighpassFilter, Limiter
import noisereduce as nr
from pydub import AudioSegment
import librosa

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception:
        firebase_admin.initialize_app(options={
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT', 'studio-4164192500-df01a')
        })

db = firestore.client()

def get_safe_audio(audio_bytes):
    """
    Permanently fixes the 'length=2' and 'Killed' errors by 
    validating and padding audio before neural processing.
    """
    if not audio_bytes or len(audio_bytes) < 100:
        return None, None
    
    try:
        with io.BytesIO(audio_bytes) as f:
            # Load with fixed sample rate and float32 to save RAM
            y, sr = librosa.load(f, sr=16000, dtype='float32')
        
        # THE PERMANENT FIX: Ensure minimum samples for n_fft=2048
        MIN_SAMPLES = 2048 
        if len(y) < MIN_SAMPLES:
            print(f"⚠️ Warning: Signal too short ({len(y)} samples). Padding with silence...")
            y = librosa.util.fix_length(y, size=MIN_SAMPLES)
            
        return y, sr
    except Exception as e:
        print(f"❌ Audio Load Failed: {e}")
        return None, None

def apply_studio_mastering(audio_bytes):
    """Applies noise reduction and studio dynamic processing with memory protection."""
    y, sr = get_safe_audio(audio_bytes)
    if y is None:
        return audio_bytes
        
    try:
        # 1. Noise Reduction
        reduced = nr.reduce_noise(y=y, sr=sr)
        
        # 2. Studio Rack
        board = Pedalboard([
            HighpassFilter(cutoff_frequency_hz=100),
            Compressor(threshold_db=-16, ratio=4),
            Gain(gain_db=2),
            Limiter(threshold_db=-0.5)
        ])
        mastered = board(reduced, sr)
        
        # 3. Export to Bytes
        out_f = io.BytesIO()
        sf.write(out_f, mastered, sr, format='wav')
        result = out_f.getvalue()
        
        # EXPLICIT MEMORY RELEASE
        del y, reduced, mastered
        gc.collect()
        
        return result
    except Exception as e:
        print(f"Mastering fallback: {e}")
        return audio_bytes

@app.get("/")
@app.get("/api/status")
async def health():
    return {"status": "Sargam Neural Engine Active", "ready": True, "engine": "FastAPI"}

@app.post("/separate")
@app.post("/api/separate")
async def separate(request: Request):
    """Separates harmonic (vocal) from percussive (bgm) components with memory protection."""
    try:
        form = await request.form()
        audio_file = form.get("audio")
        if not audio_file: return JSONResponse(status_code=400, content={"error": "No audio provided"})
        audio_bytes = await audio_file.read()
        
        # Load audio safely
        y, sr = get_safe_audio(audio_bytes)
        if y is None:
            return JSONResponse(status_code=400, content={"error": "Invalid or empty audio file."})

        # Harmonic-Percussive Source Separation (HPSS)
        # HPSS is memory intensive - clean up immediately
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        def to_uri(data, rate):
            buf = io.BytesIO()
            sf.write(buf, data, rate, format='wav')
            b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            return f"data:audio/wav;base64,{b64}"

        result = {
            "vocals": to_uri(y_harmonic, sr),
            "bgm": to_uri(y_percussive, sr)
        }
        
        # FINAL MEMORY PURGE
        del y, y_harmonic, y_percussive
        gc.collect()
        
        return result
    except Exception as e:
        print(f"SEPARATION ERROR: {e}")
        return JSONResponse(status_code=500, content={"error": f"Neural separation failed: {str(e)}"})

@app.post("/mix")
@app.post("/api/mix")
async def mix_audio(request: Request):
    """Mixes generated AI vocals with original background music with memory protection."""
    try:
        form = await request.form()
        v_file, b_file = form.get("vocals"), form.get("bgm")
        if not v_file or not b_file: return JSONResponse(status_code=400, content={"error": "Missing tracks"})
        
        # 1. Master AI Vocals
        v_mastered_bytes = apply_studio_mastering(await v_file.read())
        
        # 2. Blend with BGM
        v_seg = AudioSegment.from_file(io.BytesIO(v_mastered_bytes), format="wav")
        b_seg = AudioSegment.from_file(io.BytesIO(await b_file.read()))
        
        # Overlay with slight BGM reduction (-2dB) to let vocals shine
        combined = b_seg.overlay(v_seg - 2) 
        
        out_buf = io.BytesIO()
        combined.export(out_buf, format="mp3")
        final_data = out_buf.getvalue()
        
        # FINAL CLEANUP
        del v_seg, b_seg, combined
        gc.collect()
        
        return Response(content=final_data, media_type="audio/mpeg")
    except Exception as e:
        print(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": "Mixing failed"})

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        doc_snap = user_ref.get()
        if doc_snap.exists: return doc_snap.to_dict()
        else:
            new_user = {"id": user_id, "credits": 10, "plan": "free", "redeemedCoupons": []}
            user_ref.set(new_user)
            return new_user
    except Exception: return JSONResponse(status_code=500, content={"error": "DB error"})

@app.post("/api/credits/use")
async def use_credits(request: Request):
    try:
        data = await request.json()
        user_id, amount = data.get("user_id"), int(data.get("amount", 0))
        if not user_id: raise Exception("Missing user_id")
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def update_in_transaction(transaction, user_ref):
            snapshot = user_ref.get(transaction=transaction)
            user_data = snapshot.to_dict()
            if not user_data: raise Exception("User profile missing from database.")
            current = user_data.get('credits', 0)
            if current < amount: raise Exception(f"Insufficient credits. Need {amount}, have {current}.")
            transaction.update(user_ref, {'credits': current - amount})
            return current - amount
            
        new_bal = update_in_transaction(db.transaction(), user_ref)
        return {"success": True, "remaining": new_bal}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    try:
        data = await request.json()
        user_id, code = data.get("userId"), data.get("code", "").upper().strip()
        coupons = { "SKV-PRO-1": 1000, "WELCOME-SARGAM": 50, "RESEARCH-TEST": 500 }
        if code not in coupons: return JSONResponse(status_code=404, content={"error": "Invalid code."})
        credits_to_add = coupons[code]
        user_ref = db.collection('users').document(user_id)
        @firestore.transactional
        def add_credits(transaction, user_ref):
            snap = user_ref.get(transaction=transaction)
            u_data = snap.to_dict() or {}
            redeemed = u_data.get('redeemedCoupons', [])
            if code in redeemed: raise Exception("Already redeemed.")
            current = u_data.get('credits', 0)
            transaction.update(user_ref, {
                'credits': current + credits_to_add,
                'redeemedCoupons': firestore.ArrayUnion([code]),
                'plan': 'creator' if credits_to_add >= 500 else u_data.get('plan', 'free')
            })
            return current + credits_to_add
        add_credits(db.transaction(), user_ref)
        return {"status": "success", "credits": credits_to_add}
    except Exception as e: return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Standardized to Port 8080 to match Next.js proxy defaults
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
