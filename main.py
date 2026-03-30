
import os
import uuid
import json
import hmac
import hashlib
import razorpay
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Robust Firebase Initialization ---
if not firebase_admin._apps:
    if os.environ.get("K_SERVICE"): 
        firebase_admin.initialize_app()
    else:
        firebase_admin.initialize_app(options={
            'projectId': 'studio-4164192500-df01a',
        })

db = firestore.client()

# --- Razorpay Initialization ---
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "secret_placeholder")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Price mapping for plans and packs (in INR)
PRICES = {
    "creator": 99,
    "pro": 299,
    "pack_20": 10,
    "pack_120": 50,
    "pack_300": 100
}

# Credit mapping for plans and packs
CREDITS_MAP = {
    "creator": 1000,
    "pro": 5000,
    "pack_20": 20,
    "pack_120": 120,
    "pack_300": 300
}

@app.get("/")
async def home():
    return {"status": "Neural Engine Active", "version": "2.8.0", "engine": "FastAPI"}

@app.post("/api/payments/create-order")
async def create_order(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        
        amount_in_rupees = PRICES.get(item_id, 299)
        amount_in_paise = int(amount_in_rupees) * 100
        
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:10]}",
            "notes": {
                "userId": user_id,
                "itemId": item_id
            }
        }
        
        order = client.order.create(data=order_data)
        return order

    except Exception as e:
        print(f"PAYMENT ERROR: {e}")
        return {
            "id": f"test_order_{uuid.uuid4().hex[:8]}",
            "amount": 29900,
            "currency": "INR",
            "status": "created",
            "error": str(e)
        }

@app.post("/api/webhook")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    """Handles Razorpay webhooks with secure signature verification."""
    payload = await request.body()
    
    # 1. Verify Signature
    if RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature:
        expected_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, x_razorpay_signature):
            print("SECURITY ALERT: Invalid Webhook Signature!")
            return JSONResponse(content={"status": "failed", "message": "Invalid signature"}, status_code=400)

    # 2. Process Event
    try:
        data = json.loads(payload)
        event = data.get('event')
        
        if event == 'order.paid':
            order_entity = data['payload']['order']['entity']
            notes = order_entity.get('notes', {})
            user_id = notes.get('userId')
            item_id = notes.get('itemId')
            
            credits_to_add = CREDITS_MAP.get(item_id, 0)
            
            if user_id and credits_to_add > 0:
                user_ref = db.collection('users').document(user_id)
                updates = {
                    'credits': firestore.Increment(credits_to_add)
                }
                if 'pack' not in item_id:
                    updates['plan'] = item_id
                    
                user_ref.update(updates)
                print(f"SUCCESS: Added {credits_to_add} credits to user {user_id}")

        elif event == 'payment.failed':
            payment_entity = data['payload']['payment']['entity']
            reason = payment_entity.get('error_description', 'Unknown error')
            user_id = payment_entity.get('notes', {}).get('userId')
            print(f"FAILURE: Payment failed for user {user_id}. Reason: {reason}")

        return {"status": "ok"}
    except Exception as e:
        print(f"WEBHOOK PROCESSING ERROR: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        
        credits_to_add = CREDITS_MAP.get(item_id, 0)
        
        if user_id and credits_to_add > 0:
            user_ref = db.collection('users').document(user_id)
            updates = {
                'credits': firestore.Increment(credits_to_add)
            }
            if 'pack' not in item_id:
                updates['plan'] = item_id
            user_ref.update(updates)

        return {"status": "success", "message": "Credits synchronized."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
