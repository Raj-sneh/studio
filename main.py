from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os, json, base64, gc
import librosa
import numpy as np
import soundfile as sf

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Initialize Firebase Singleton
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception:
        firebase_admin.initialize_app(options={
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT', 'studio-4164192500-df01a')
        })

db = firestore.client()

def get_safe_audio(file_path):
    """
    Permanently fixes the 'length=2' and 'Killed' errors by 
    validating and padding audio before neural processing.
    """
    try:
        if not os.path.exists(file_path) or os.path.getsize(file_path) < 100:
            return None, None

        # Load with fixed sample rate to save RAM
        y, sr = librosa.load(file_path, sr=16000, dtype='float32')

        # n_fft is usually 2048. We need at least that many samples.
        MIN_SAMPLES = 2048 
        if len(y) < MIN_SAMPLES:
            y = librosa.util.fix_length(y, size=MIN_SAMPLES)

        return y, sr
    except Exception as e:
        print(f"❌ Audio Load Failed: {e}")
        return None, None

@app.get("/api/status")
async def health():
    """Neural Engine Health Check."""
    return {"status": "Sargam AI Cloud Engine Active", "ready": True, "engine": "FastAPI"}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    """Retrieves user neural profile."""
    try:
        user_ref = db.collection('users').document(user_id)
        doc_snap = user_ref.get()
        if doc_snap.exists: return doc_snap.to_dict()
        else:
            new_user = {
                "id": user_id, 
                "credits": 10, 
                "plan": "free", 
                "redeemedCoupons": [],
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            user_ref.set(new_user)
            return new_user
    except Exception as e: 
        return JSONResponse(status_code=500, content={"error": f"Database error: {str(e)}"})

@app.post("/api/credits/use")
async def use_credits(request: Request):
    """Deducts credits for AI operations."""
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
            if not user_data: raise Exception("User profile missing.")
            current = user_data.get('credits', 0)
            if current < amount: raise Exception(f"Insufficient credits. Need {amount}, have {current}.")
            transaction.update(user_ref, {'credits': current - amount})
            return current - amount
            
        new_bal = update_in_transaction(db.transaction(), user_ref)
        gc.collect()
        return {"success": True, "remaining": new_bal}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    """Processes secret codes."""
    try:
        data = await request.json()
        user_id = data.get("userId")
        code = data.get("code", "").upper().strip()
        
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
            transaction.update(user_ref, {
                'credits': u_data.get('credits', 0) + credits_to_add,
                'redeemedCoupons': firestore.ArrayUnion([code]),
                'plan': 'creator' if credits_to_add >= 500 else u_data.get('plan', 'free')
            })
            return True
            
        add_credits(db.transaction(), user_ref)
        return {"status": "success", "credits": credits_to_add}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    # Standardized to Port 8080 for Next.js internal proxy alignment
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
