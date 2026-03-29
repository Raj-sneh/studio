import os
import sys
import uuid
import subprocess
import base64
import razorpay
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# 1. Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    db = firestore.client()
except Exception as e:
    print(f"FIREBASE ADMIN ERROR: {e}")
    db = None

# 2. Initialize Razorpay
RAZOR_KEY_ID = os.environ.get("RAZORPAY_KEY_ID") or os.environ.get("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZOR_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "placeholder_secret")

client = razorpay.Client(auth=(RAZOR_KEY_ID, RAZOR_KEY_SECRET))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLAN_LIMITS = {
    "free": 5,
    "creator": 50,
    "pro": 500
}

CREDIT_PACKS = {
    "pack_20": {"credits": 20, "price": 10},
    "pack_120": {"credits": 120, "price": 50},
    "pack_300": {"credits": 300, "price": 100},
}

SUBSCRIPTIONS = {
    "creator": {"credits": 50, "price": 99},
    "pro": {"credits": 500, "price": 299},
}

# Source of truth for costs
ACTION_COSTS = {
    "melody": 5,
    "vocal_studio": 2,
    "vocal_swap": 10,
    "voice_clone": 20
}

@app.get("/")
def home():
    return {"status": "Sargam Neural Engine Active", "version": "2.3.0"}

@app.get("/health")
def health():
    return {"ready": True, "database": db is not None}

@app.get("/credits/status/{user_id}")
async def get_status(user_id: str):
    """Pings user status and resets daily credits if necessary."""
    if not db:
        return JSONResponse(status_code=500, content={"error": "Database offline"})
    
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    data = user_doc.to_dict()
    plan = data.get('plan', 'free')
    credits = data.get('credits', 0)
    last_reset = data.get('lastReset')
    
    now = datetime.now(timezone.utc)
    should_reset = False
    
    if not last_reset:
        should_reset = True
    else:
        # Normalize timestamp
        last_reset_dt = last_reset
        if not isinstance(last_reset, datetime):
            try:
                last_reset_dt = datetime.fromisoformat(str(last_reset))
            except:
                last_reset_dt = now
        
        # Check if 24 hours passed
        if (now - last_reset_dt).days >= 1:
            should_reset = True
            
    if should_reset:
        credits = PLAN_LIMITS.get(plan, 5)
        user_ref.update({
            'credits': credits,
            'lastReset': now
        })
        
    return {
        "userId": user_id,
        "plan": plan,
        "credits": credits,
        "limit": PLAN_LIMITS.get(plan)
    }

@app.post("/credits/use")
async def use_credits(user_id: str = Body(..., embed=True), amount: int = Body(..., embed=True)):
    """Deducts credits from user account."""
    if not db:
        return JSONResponse(status_code=500, content={"error": "Database offline"})
        
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return JSONResponse(status_code=404, content={"error": "User not found"})
        
    current_credits = user_doc.to_dict().get('credits', 0)
    
    if current_credits < amount:
        return JSONResponse(status_code=402, content={"error": "Insufficient credits"})
        
    user_ref.update({'credits': current_credits - amount})
    return {"status": "success", "remaining": current_credits - amount}

# --- RAZORPAY ENDPOINTS ---

@app.post("/payments/create-order")
async def create_order(user_id: str = Body(...), item_id: str = Body(...), type: str = Body(...)):
    """Creates a Razorpay order for a specific credit pack or subscription."""
    amount_in_paise = 0
    if type == "pack":
        amount_in_paise = CREDIT_PACKS.get(item_id, {}).get("price", 0) * 100
    elif type == "plan":
        amount_in_paise = SUBSCRIPTIONS.get(item_id, {}).get("price", 0) * 100
    
    if amount_in_paise == 0:
        return JSONResponse(status_code=400, content={"error": "Invalid item or zero price"})

    order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"receipt_{uuid.uuid4().hex[:6]}",
        "notes": {
            "userId": user_id,
            "itemId": item_id,
            "type": type
        }
    }
    
    try:
        order = client.order.create(data=order_data)
        return order
    except Exception as e:
        print(f"RAZORPAY ORDER ERROR: {e}")
        return JSONResponse(status_code=500, content={"error": "Could not create Razorpay order"})

@app.post("/payments/verify")
async def verify_payment(
    razorpay_order_id: str = Body(...),
    razorpay_payment_id: str = Body(...),
    razorpay_signature: str = Body(...),
    user_id: str = Body(...),
    item_id: str = Body(...),
    type: str = Body(...)
):
    """Verifies Razorpay signature and updates user credits/plan."""
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }

    try:
        client.utility.verify_payment_signature(params_dict)
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid signature"})

    if not db:
        return JSONResponse(status_code=500, content={"error": "Database offline"})

    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return JSONResponse(status_code=404, content={"error": "User not found"})

    if type == "pack":
        pack_data = CREDIT_PACKS.get(item_id)
        if pack_data:
            user_ref.update({
                'credits': firestore.Increment(pack_data['credits'])
            })
    elif type == "plan":
        plan_data = SUBSCRIPTIONS.get(item_id)
        if plan_data:
            user_ref.update({
                'plan': item_id,
                'credits': plan_data['credits'],
                'lastReset': datetime.now(timezone.utc)
            })

    return {"status": "success", "message": "Payment verified and account updated"}

if __name__ == "__main__":
    import uvicorn
    # Hidden folder for temp files to avoid Next.js watcher restarts
    if not os.path.exists('.engine_temp'):
        os.makedirs('.engine_temp')
    uvicorn.run(app, host="0.0.0.0", port=1000)
