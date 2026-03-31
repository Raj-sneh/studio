from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac
import hashlib
import os
from dotenv import load_dotenv

# Load environment variables from .env file (local development)
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Firebase Initialization ---
# Uses Application Default Credentials (ADC) for secure production connection.
if not firebase_admin._apps:
    try:
        # standard init for Studio/Cloud environments
        firebase_admin.initialize_app()
    except Exception:
        # Fallback for manual project ID injection
        firebase_admin.initialize_app(options={
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT')
        })

db = firestore.client()

@app.get("/")
async def home():
    return {"status": "Sargam Neural Engine Active", "engine": "FastAPI"}

@app.get("/api/status")
async def get_status():
    """Standardized health check for the credit and account engine."""
    return {"status": "online", "engine": "FastAPI", "ready": True}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            # Initialize default user if not found
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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/credits/use")
async def use_credits(request: Request):
    try:
        data = await request.json()
        user_id = data.get("user_id")
        amount = data.get("amount", 0)

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        user_ref = db.collection('users').document(user_id)
        
        # Transactional credit deduction using snapshot.to_dict() pattern
        @firestore.transactional
        def update_in_transaction(transaction, user_ref):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise Exception("User record not found in neural database.")
            
            user_data = snapshot.to_dict()
            current_credits = user_data.get('credits', 0)
            
            if current_credits < amount:
                raise Exception(f"Insufficient credits. Need {amount}, have {current_credits}.")
            
            new_balance = current_credits - amount
            transaction.update(user_ref, {'credits': new_balance})
            return new_balance

        transaction = db.transaction()
        new_balance = update_in_transaction(transaction, user_ref)
        return {"success": True, "remaining_credits": new_balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    try:
        data = await request.json()
        user_id = data.get("userId")
        code = data.get("code", "").strip().upper()

        # Define official neural allocation codes
        coupons = {
            "SKV-PRO-1": 100, "SKV-PRO-2": 100, "SKV-PRO-3": 100,
            "SKV-CREATOR-1": 50, "SKV-CREATOR-2": 50, "SKV-CREATOR-3": 50,
            "NEURAL-X": 25, "NEURAL-Y": 25, "NEURAL-Z": 25,
            "SARGAM-ELITE": 500, "STAGE-PASS": 10, "SKV-FREE-BIE": 5,
            "TEST-COUPON": 999, "ALPHA-KEY": 100, "BETA-KEY": 100
        }

        if code not in coupons:
            raise HTTPException(status_code=404, detail="Invalid neural coupon code.")

        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not provisioned.")

        user_data = doc.to_dict()
        redeemed = user_data.get("redeemedCoupons", [])

        if code in redeemed:
            raise HTTPException(status_code=400, detail="Coupon code already utilized.")

        credits_to_add = coupons[code]
        user_ref.update({
            "credits": user_data.get("credits", 0) + credits_to_add,
            "redeemedCoupons": firestore.ArrayUnion([code])
        })

        return {"success": True, "credits": credits_to_add}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhook/elevenlabs")
async def elevenlabs_webhook(request: Request):
    webhook_secret = os.environ.get("ELEVENLABS_WEBHOOK_SECRET")
    signature = request.headers.get("X-ElevenLabs-Signature")
    body = await request.body()

    if not signature or not webhook_secret:
        return JSONResponse(status_code=401, content={"error": "Neural security config missing"})

    mac = hmac.new(webhook_secret.encode(), msg=body, digestmod=hashlib.sha256)
    expected_signature = mac.hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        return JSONResponse(status_code=401, content={"error": "Invalid neural signature"})

    data = await request.json()
    print(f"ElevenLabs Neural Webhook received: {data.get('status', 'unknown')}")
    return {"status": "ok"}
