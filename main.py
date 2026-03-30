
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

# Neural Coupons - Simplified with direct lookup
# 5 Creator Coupons (1,000 credits, Alphanumeric)
# 5 Pro Coupons (5,000 credits, Alphanumeric + @#$)
COUPONS = {
    "SKV1000NEW": 1000,
    "CrEaT0r99x": 1000,
    "MaGic123S": 1000,
    "skvCreaTor7": 1000,
    "SKV-CREATOR-1": 1000,
    "PRO@NEURAL#1": 5000,
    "SONIC$SKV#25": 5000,
    "MASTER@VOICE$": 5000,
    "SKV#V0ice@99": 5000,
    "SKV-PRO-1": 5000,
}

@app.get("/")
async def home():
    return {"status": "Sargam Neural Engine Active", "version": "3.8.0", "engine": "FastAPI"}

@app.get("/health")
async def health():
    return {"ready": True}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            return JSONResponse(content={"error": "User account not found."}, status_code=404)
        user_data = user_doc.to_dict()
        return {"credits": user_data.get('credits', 0), "plan": user_data.get('plan', 'free')}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/credits/use")
async def use_credits(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        amount = int(data.get('amount', 0))
        if not user_id: return JSONResponse(content={"error": "User ID is required"}, status_code=400)
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def deduct_in_transaction(transaction, user_ref, amount):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists: return {"error": "User not found."}
            current_credits = snapshot.get('credits', 0)
            if current_credits < amount: return {"error": f"Insufficient credits ({current_credits})."}
            transaction.update(user_ref, {'credits': firestore.Increment(-amount)})
            return {"success": True, "remaining": current_credits - amount}

        result = deduct_in_transaction(db.transaction(), user_ref, amount)
        if "error" in result: return JSONResponse(content={"error": result["error"]}, status_code=400)
        return result
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    try:
        data = await request.json()
        user_id = data.get('userId')
        code = data.get('code')
        
        if not user_id or not code:
            return JSONResponse(content={"error": "Missing user ID or code"}, status_code=400)
        
        # Simple if/elif/else logic via dictionary lookup
        credits_to_add = COUPONS.get(code)
        if not credits_to_add:
            return JSONResponse(content={"error": "Invalid coupon code."}, status_code=404)
            
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def redeem_in_transaction(transaction, user_ref, code, credits_to_add):
            snapshot = user_ref.get(transaction=transaction)
            if not snapshot.exists: return {"error": "User account not found."}
            user_data = snapshot.to_dict()
            redeemed = user_data.get('redeemedCoupons', [])
            
            # Reusing same code is restricted per user
            if code in redeemed: 
                return {"error": "Coupon already used."}
            
            updates = {
                'credits': firestore.Increment(credits_to_add),
                'redeemedCoupons': firestore.ArrayUnion([code])
            }
            # Auto-upgrade plan based on credits
            if credits_to_add >= 5000: 
                updates['plan'] = 'pro'
            elif credits_to_add >= 1000: 
                updates['plan'] = 'creator'
            
            transaction.update(user_ref, updates)
            return {"success": True, "credits": credits_to_add}

        result = redeem_in_transaction(db.transaction(), user_ref, code, credits_to_add)
        if "error" in result: return JSONResponse(content={"error": result["error"]}, status_code=400)
        return result
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/payments/create-order")
async def create_order(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        amount_paise = int(PRICES.get(item_id, 299)) * 100
        order = client.order.create(data={
            "amount": amount_paise, "currency": "INR", "receipt": f"rcpt_{uuid.uuid4().hex[:10]}",
            "notes": {"userId": user_id, "itemId": item_id}
        })
        return order
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    try:
        data = await request.json()
        user_id, item_id = data.get('user_id'), data.get('item_id')
        credits = CREDITS_MAP.get(item_id, 0)
        if user_id and credits > 0:
            user_ref = db.collection('users').document(user_id)
            updates = {'credits': firestore.Increment(credits)}
            if 'pack' not in item_id: updates['plan'] = item_id
            user_ref.update(updates)
        return {"status": "success"}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
