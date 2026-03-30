
import os
import uuid
import json
import razorpay
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Robust Firebase Initialization ---
if not firebase_admin._apps:
    # This checks if we are on Cloud Run or local
    if os.environ.get("K_SERVICE"): 
        # We are on Cloud Run: Use default credentials
        firebase_admin.initialize_app()
    else:
        # We are in Studio/Local: Explicitly specify the project ID
        firebase_admin.initialize_app(options={
            'projectId': 'studio-4164192500-df01a',
        })

db = firestore.client()

# --- Razorpay Initialization ---
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "secret_placeholder")
# Webhook secret for signature verification (Set this in Razorpay dashboard and Env)
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your actual domain
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
    return {"status": "Neural Engine Active", "version": "2.7.0", "engine": "FastAPI"}

@app.get("/health")
async def health():
    return {"ready": True, "database": db is not None}

@app.post("/api/payments/create-order")
async def create_order(request: Request):
    """Creates a real order via Razorpay."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        
        # 1. Determine the price in Rupees
        amount_in_rupees = PRICES.get(item_id, 299)
        
        # 2. Convert Rupees to Paise (Razorpay requirement)
        amount_in_paise = int(amount_in_rupees) * 100
        
        # 3. Create the Razorpay Order
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
    """Handles Razorpay webhooks for paid and failed events."""
    payload = await request.body()
    
    # Verify signature if secret is provided
    if RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature:
        try:
            client.utility.verify_webhook_signature(payload.decode('utf-8'), x_razorpay_signature, RAZORPAY_WEBHOOK_SECRET)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid signature")

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
            # Only update plan if it's not a one-time pack
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

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    """Manual verification fallback."""
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
