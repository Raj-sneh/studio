
import os
import sys
import uuid
import subprocess
import base64
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        # For production/studio environments, this will use local credentials or environment variables
        firebase_admin.initialize_app()
    db = firestore.client()
except Exception as e:
    print(f"FIREBASE ADMIN ERROR: {e}")
    db = None

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

@app.get("/")
def home():
    return {"status": "Sargam Neural Engine Active", "version": "2.1.0"}

@app.get("/health")
def health():
    return {"ready": True, "database": db is not None}

@app.get("/credits/status/{user_id}")
async def get_status(user_id: str):
    """Gets user plan and handles daily credit reset logic."""
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
    
    # Check if reset is needed (Once per 24h)
    now = datetime.now(timezone.utc)
    should_reset = False
    
    if not last_reset:
        should_reset = True
    else:
        # Handle firestore timestamp conversion
        if isinstance(last_reset, datetime):
            last_reset_dt = last_reset
        else:
            try:
                last_reset_dt = datetime.fromisoformat(str(last_reset))
            except:
                last_reset_dt = now # Fallback
        
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
    """Securely deducts credits from a user account."""
    if not db:
        return JSONResponse(status_code=500, content={"error": "Database offline"})
        
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return JSONResponse(status_code=404, content={"error": "User not found"})
        
    current_credits = user_doc.to_dict().get('credits', 0)
    
    if current_credits < amount:
        return JSONResponse(status_code=402, content={"error": f"Insufficient credits. Need {amount}, have {current_credits}"})
        
    user_ref.update({
        'credits': current_credits - amount
    })
    
    return {"status": "success", "remaining": current_credits - amount}

@app.post("/credits/upgrade")
async def upgrade_plan(user_id: str = Body(..., embed=True), plan: str = Body(..., embed=True)):
    """Upgrades a user to a premium plan."""
    if plan not in PLAN_LIMITS:
        return JSONResponse(status_code=400, content={"error": "Invalid plan"})
        
    if not db:
        return JSONResponse(status_code=500, content={"error": "Database offline"})

    user_ref = db.collection('users').document(user_id)
    user_ref.update({
        'plan': plan,
        'credits': PLAN_LIMITS[plan],
        'lastReset': datetime.now(timezone.utc)
    })
    
    return {"status": "success", "plan": plan}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=1000)
