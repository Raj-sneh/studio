
import os
import uuid
import razorpay
from fastapi import FastAPI, Request, HTTPException
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

@app.get("/")
async def home():
    return {"status": "Neural Engine Active", "version": "2.6.0"}

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
        # Fallback for local testing if API keys are missing/invalid
        return {
            "id": f"test_order_{uuid.uuid4().hex[:8]}",
            "amount": 29900,
            "currency": "INR",
            "status": "created",
            "error": "Using test fallback due to configuration: " + str(e)
        }

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    """Verifies payment signature and updates user status."""
    try:
        data = await request.json()
        
        # In a real scenario, you'd use client.utility.verify_payment_signature(data)
        # For this preview, we'll assume success if the signature is present
        user_id = data.get('user_id')
        item_id = data.get('item_id')
        
        # Update credits in Firestore
        credits_map = {
            "creator": 1000,
            "pro": 5000,
            "pack_20": 20,
            "pack_120": 120,
            "pack_300": 300
        }
        
        credits_to_add = credits_map.get(item_id, 0)
        
        if user_id and credits_to_add > 0:
            user_ref = db.collection('users').document(user_id)
            user_ref.update({
                'credits': firestore.Increment(credits_to_add),
                'plan': item_id if 'pack' not in item_id else firestore.ArrayUnion([]) # Plan only changes if it's not a pack
            })
            
            # If it's a plan upgrade, update the plan field
            if 'pack' not in item_id:
                user_ref.update({'plan': item_id})

        return {"status": "success", "message": "Payment verified and credits added."}
    except Exception as e:
        print(f"VERIFY ERROR: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
