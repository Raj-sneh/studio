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

# Enable CORS for cross-origin requests from the Next.js frontend
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
    return {"status": "Sargam Neural Engine Active", "version": "3.5.0", "engine": "FastAPI"}

@app.get("/health")
async def health():
    return {"ready": True}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    """Retrieves current credits and plan for a specific user."""
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return JSONResponse(content={"error": "User account not found in database."}, status_code=404)
            
        user_data = user_doc.to_dict()
        return {
            "credits": user_data.get('credits', 0),
            "plan": user_data.get('plan', 'free')
        }
    except Exception as e:
        print(f"STATUS ERROR: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/credits/use")
async def use_credits(request: Request):
    """Deducts credits from a user's account with insufficient funds check."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        amount = int(data.get('amount', 0))
        
        if not user_id:
            return JSONResponse(content={"error": "User ID is required"}, status_code=400)
            
        user_ref = db.collection('users').document(user_id)

        # Transactional update to prevent negative credits
        transaction = db.transaction()

        @firestore.transactional
        def deduct_in_transaction(transaction, user_ref, amount):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists:
                return {"error": "User not found"}
            
            current_credits = snapshot.get('credits', 0)
            if current_credits < amount:
                return {"error": f"Insufficient credits. You need {amount} but only have {current_credits}."}
            
            transaction.update(user_ref, {
                'credits': firestore.Increment(-amount)
            })
            return {"success": True, "remaining": current_credits - amount}

        result = deduct_in_transaction(transaction, user_ref, amount)
        
        if "error" in result:
            return JSONResponse(content={"error": result["error"]}, status_code=400)
            
        print(f"✅ CREDITS USED: {amount} deducted from {user_id}. Remaining: {result['remaining']}")
        return result
        
    except Exception as e:
        print(f"DEDUCTION ERROR: {e}")
        return JSONResponse(content={"error": f"Internal deduction error: {str(e)}"}, status_code=500)

@app.post("/api/create-order")
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
        print(f"✅ Order Created: {order['id']} for User: {user_id} ({item_id})")
        return order

    except Exception as e:
        print(f"PAYMENT ERROR: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/webhook")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    payload = await request.body()
    
    if RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature:
        expected_signature = hmac.new(
            RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, x_razorpay_signature):
            print("SECURITY ALERT: Invalid Webhook Signature!")
            return JSONResponse(content={"status": "failed", "message": "Invalid signature"}, status_code=400)

    try:
        data = json.loads(payload)
        event = data.get('event')
        
        entity = None
        if event in ['order.paid', 'payment.captured']:
            entity = data['payload'].get('order', {}).get('entity') or \
                     data['payload'].get('payment', {}).get('entity')
            
        elif event == 'payment.failed':
            payment_entity = data['payload']['payment']['entity']
            reason = payment_entity.get('error_description', 'Unknown failure')
            user_id = payment_entity.get('notes', {}).get('userId', 'Unknown')
            print(f"❌ Payment Failed for user {user_id}. Reason: {reason}")
            return {"status": "ok"}

        if entity:
            notes = entity.get('notes', {})
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
                print(f"✅ SUCCESS: Webhook {event} processed. Added {credits_to_add} credits to {user_id} for {item_id}")

        return {"status": "ok"}
    except Exception as e:
        print(f"WEBHOOK ERROR: {e}")
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

@app.post("/api/verify")
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