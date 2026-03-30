
import os
import uuid
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

app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace "*" with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"status": "Neural Engine Active", "version": "2.5.0"}

@app.get("/health")
async def health():
    return {"ready": True, "database": db is not None}

@app.post("/api/create-order")
async def create_order(request: Request):
    """Creates a test order for Razorpay."""
    try:
        data = await request.json()
        user_id = data.get('user_id')
        item_id = data.get('item_id', 'pro')
        
        # Mock order data for test mode
        order_data = {
            "id": f"order_{uuid.uuid4().hex[:12]}",
            "amount": 50000, # 500 INR in paise
            "currency": "INR",
            "status": "created",
            "notes": {
                "userId": user_id,
                "itemId": item_id
            }
        }
        return order_data
    except Exception as e:
        print(f"ERROR: {e}")
        return {"id": "test_order_123", "error": str(e)}

@app.post("/api/verify")
async def verify_payment(request: Request):
    """Verifies payment signature and updates user status."""
    # Logic to verify Razorpay signature and update Firestore
    return {"status": "success", "message": "Payment verified by Neural Engine."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
