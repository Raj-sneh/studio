from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac
import hashlib
import os
import json
import base64
import traceback
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
# Uses generic initialization to support environment-based ADC
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

# --- Helper: Credit Mapping ---
def get_credits_for_amount(amount_rupees):
    mapping = {299: 5000, 99: 1000, 100: 300, 50: 120, 10: 20}
    return mapping.get(amount_rupees, 0)

# --- Routes ---

@app.get("/")
@app.get("/api/status")
async def get_status():
    """Satisfies health checks and polling logic"""
    return {"status": "Sargam Neural Engine Active", "ready": True, "engine": "FastAPI"}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        if doc.exists:
            return doc.to_dict()
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
    """Secure webhook for neural processing events"""
    webhook_secret = os.environ.get("ELEVENLABS_WEBHOOK_SECRET")
    signature = request.headers.get("X-ElevenLabs-Signature")
    body = await request.body()

    if webhook_secret and signature:
        mac = hmac.new(webhook_secret.encode(), msg=body, digestmod=hashlib.sha256)
        expected = mac.hexdigest()
        if not hmac.compare_digest(expected, signature):
            return JSONResponse(status_code=401, content={"error": "Invalid signature"})

    data = await request.json()
    print(f"SKV AI: ElevenLabs Webhook Event: {data.get('status')}")
    return {"status": "ok"}

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    """Secure coupon redemption logic"""
    try:
        data = await request.json()
        user_id, code = data.get("userId"), data.get("code", "").upper().strip()
        
        # Hardcoded promo codes for prototype
        coupons = {
            "SKV-PRO-1": 1000,
            "WELCOME-SARGAM": 50,
            "RESEARCH-TEST": 500
        }
        
        if code not in coupons:
            return JSONResponse(status_code=404, content={"error": "Invalid or expired coupon code."})
            
        credits_to_add = coupons[code]
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def add_credits(transaction, user_ref):
            snap = user_ref.get(transaction=transaction)
            u_data = snap.to_dict() or {}
            redeemed = u_data.get('redeemedCoupons', [])
            
            if code in redeemed: raise Exception("Coupon already redeemed by this account.")
            
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
