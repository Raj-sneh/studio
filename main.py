from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac, hashlib, os, json, base64, traceback, io, gc
import soundfile as sf
import numpy as np

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

@app.get("/")
@app.get("/api/status")
async def health():
    """Lightweight health check."""
    return {"status": "Sargam AI Cloud Engine Active", "ready": True, "engine": "FastAPI"}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    """Retrieves or initializes user credit profile."""
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
    """Securely deducts credits for AI operations."""
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
        return {"success": True, "remaining": new_bal}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    """Processes secret codes for neural credit allocation."""
    try:
        data = await request.json()
        user_id = data.get("userId")
        code = data.get("code", "").upper().strip()
        
        # Secret Codes Registry
        coupons = { 
            "SKV-PRO-1": 1000, 
            "WELCOME-SARGAM": 50, 
            "RESEARCH-TEST": 500,
            "SNEH-SPECIAL": 2000
        }
        
        if code not in coupons: return JSONResponse(status_code=404, content={"error": "Invalid code."})
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
    # Synchronized to Port 8080 for Next.js internal proxy
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
