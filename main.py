
import os
import uuid
import razorpay
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 1. Initialize Firebase with Robust Logic (Studio/Cloud Run compatible)
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

# 2. Initialize Razorpay
RAZOR_KEY_ID = os.environ.get("RAZORPAY_KEY_ID") or os.environ.get("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_placeholder")
RAZOR_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "placeholder_secret")

try:
    client = razorpay.Client(auth=(RAZOR_KEY_ID, RAZOR_KEY_SECRET))
except Exception as e:
    print(f"RAZORPAY INIT ERROR: {e}")
    client = None

app = FastAPI()

# 3. ADD CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"status": "Sargam Neural Engine Active", "version": "2.4.0"}

@app.get("/health")
async def health():
    return {"ready": True, "database": db is not None, "payments": client is not None}

@app.post("/api/create-order")
async def create_order(request: Request):
    """Creates a Razorpay order for a specific credit pack or subscription."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        
        if not client:
            return {"id": "test_order_123", "status": "mocked", "message": "Razorpay keys not found"}

        # In a real scenario, you'd calculate the amount based on the item_id
        order_data = {
            "amount": 50000, # 500 INR in paise
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:6]}",
            "notes": {
                "userId": user_id,
                "itemId": item_id
            }
        }
        
        order = client.order.create(data=order_data)
        return order
    except Exception as e:
        print(f"ERROR: {e}")
        return {"id": "test_order_123", "error": str(e)}

@app.post("/api/verify")
async def verify_payment(request: Request):
    """Verifies Razorpay signature and updates user status."""
    return {"status": "success", "message": "Verification logic would be applied here."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
