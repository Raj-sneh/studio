
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
    return {"status": "Sargam Neural Engine Active", "version": "3.6.0", "engine": "FastAPI"}

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
    """Deducts credits from a user's account with a thread-safe Firestore transaction."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        amount = int(data.get('amount', 0))
        
        if not user_id:
            return JSONResponse(content={"error": "User ID is required"}, status_code=400)
            
        user_ref = db.collection('users').document(user_id)

        # Transactional update to prevent negative credits and ensure data consistency
        transaction = db.transaction()

        @firestore.transactional
        def deduct_in_transaction(transaction, user_ref, amount):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists:
                return {"error": "User not found in database."}
            
            current_credits = snapshot.get('credits', 0)
            if current_credits < amount:
                return {"error": f"Insufficient credits. Required: {amount}, Available: {current_credits}."}
            
            transaction.update(user_ref, {
                'credits': firestore.Increment(-amount)
            })
            return {"success": True, "remaining": current_credits - amount}

        result = deduct_in_transaction(transaction, user_ref, amount)
        
        if "error" in result:
            print(f"❌ DEDUCTION FAILED for {user_id}: {result['error']}")
            return JSONResponse(content={"error": result["error"]}, status_code=400)
            
        print(f"✅ CREDITS USED: {amount} deducted from {user_id}. Remaining: {result['remaining']}")
        return result
        
    except Exception as e:
        print(f"CRITICAL DEDUCTION ERROR: {e}")
        return JSONResponse(content={"error": f"Internal deduction service error: {str(e)}"}, status_code=500)

@app.post("/api/payments/create-order")
async def create_order(request: Request):
    """Initiates a Razorpay order for plan upgrades or credit packs."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        
        amount_in_rupees = PRICES.get(item_id, 299)
        amount_in_paise = int(amount_in_rupees) * 100
        
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"rcpt_{uuid.uuid4().hex[:10]}",
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

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    """Manual verification of a Razorpay payment after checkout."""
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
            print(f"✅ Payment Verified: Granted {credits_to_add} to {user_id}")

        return {"status": "success", "message": "Neural credits synchronized."}
    except Exception as e:
        print(f"VERIFICATION ERROR: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
