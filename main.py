from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import hmac
import hashlib
import os

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate("google-services.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

@app.get("/")
async def home():
    return {"status": "Sargam Neural Engine Active", "engine": "FastAPI"}

@app.get("/api/status")
async def get_status():
    """Standard health check for the neural engine."""
    return {"status": "online", "engine": "FastAPI"}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    """Retrieves or initializes user credits."""
    try:
        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            # Initialize new users with 5 starter credits
            new_user = {
                "id": user_id,
                "credits": 5, 
                "plan": "free",
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            user_ref.set(new_user)
            return new_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/credits/use")
async def use_credits(request: Request):
    """Deducts credits for neural operations using a transaction."""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        amount = data.get("amount", 0)

        if not user_id:
            raise HTTPException(status_code=400, detail="Missing user_id")

        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def update_in_transaction(transaction, user_ref):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists:
                raise Exception("User not found")
            
            # Robust dictionary retrieval
            user_data = snapshot.to_dict()
            current_credits = user_data.get('credits', 0)
            
            if current_credits < amount:
                raise Exception(f"Insufficient credits. Need {amount}, have {current_credits}.")
            
            transaction.update(user_ref, {
                'credits': current_credits - amount
            })
            return current_credits - amount

        transaction = db.transaction()
        new_balance = update_in_transaction(transaction, user_ref)
        return {"success": True, "remaining_credits": new_balance}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    """Redeems a one-time use coupon code."""
    try:
        data = await request.json()
        user_id = data.get("userId")
        code = data.get("code", "").strip().upper()

        # 15 Randomized Neural Coupons
        coupons = {
            "SKV-PRO-1": 100, "SKV-PRO-2": 100, "SKV-PRO-3": 100,
            "SKV-CREATOR-1": 50, "SKV-CREATOR-2": 50, "SKV-CREATOR-3": 50,
            "NEURAL-X": 25, "NEURAL-Y": 25, "NEURAL-Z": 25,
            "SARGAM-ELITE": 500, "STAGE-PASS": 10, "SKV-FREE-BIE": 5,
            "TEST-COUPON": 999, "ALPHA-KEY": 100, "BETA-KEY": 100
        }

        if code not in coupons:
            raise HTTPException(status_code=404, detail="Invalid coupon code.")

        user_ref = db.collection('users').document(user_id)
        doc = user_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found.")

        user_data = doc.to_dict()
        redeemed = user_data.get("redeemedCoupons", [])

        if code in redeemed:
            raise HTTPException(status_code=400, detail="Coupon already used.")

        # Update credits and mark as redeemed
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
    """Handles secure events from ElevenLabs."""
    webhook_secret = os.environ.get("ELEVENLABS_WEBHOOK_SECRET", "placeholder_secret")
    signature = request.headers.get("X-ElevenLabs-Signature")
    body = await request.body()

    if not signature:
        return JSONResponse(status_code=401, content={"error": "Missing signature"})

    mac = hmac.new(webhook_secret.encode(), msg=body, digestmod=hashlib.sha256)
    expected_signature = mac.hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        return JSONResponse(status_code=401, content={"error": "Invalid signature"})

    data = await request.json()
    # Log the status for neural tracking
    print(f"ElevenLabs Webhook received: {data.get('status', 'unknown')}")
    
    return {"status": "ok"}
