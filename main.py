from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
import os, json, base64, gc
import librosa
import numpy as np
import soundfile as sf
import razorpay

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Initialize Firebase Singleton
if not firebase_admin._apps:
    try:
        firebase_admin.initialize_app()
    except Exception:
        firebase_admin.initialize_app(options={
            'projectId': os.environ.get('GOOGLE_CLOUD_PROJECT', 'studio-4164192500-df01a')
        })

db = firestore.client()

# Initialize Razorpay Client
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_placeholder')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'placeholder_secret')
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

@app.get("/api/status")
@app.get("/")
async def health():
    """Neural Engine Health Check."""
    return {"status": "Sargam AI Cloud Engine Active", "ready": True, "engine": "FastAPI"}

@app.get("/api/credits/status/{user_id}")
async def get_credits_status(user_id: str):
    """Retrieves user neural profile."""
    try:
        user_ref = db.collection('users').document(user_id)
        doc_snap = user_ref.get()
        if doc_snap.exists: return doc_snap.to_dict()
        else:
            new_user = {
                "id": user_id, 
                "credits": 10, 
                "plan": "free", 
                "redeemedCoupons": [],
                "createdAt": firestore.SERVER_TIMESTAMP
            }
            user_ref.set(new_user)
            return new_user
    except Exception as e: 
        return JSONResponse(status_code=500, content={"error": f"Database error: {str(e)}"})

@app.post("/api/credits/use")
async def use_credits(request: Request):
    """Deducts credits for AI operations."""
    try:
        data = await request.json()
        user_id = data.get("user_id")
        amount = int(data.get("amount", 0))
        
        if not user_id: raise Exception("Missing user_id")
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def update_in_transaction(transaction, user_ref):
            snapshot = user_ref.get(transaction=transaction)
            user_data = snapshot.to_dict()
            if not user_data: raise Exception("User profile missing.")
            current = user_data.get('credits', 0)
            if current < amount: raise Exception(f"Insufficient credits. Need {amount}, have {current}.")
            transaction.update(user_ref, {'credits': current - amount})
            return current - amount
            
        new_bal = update_in_transaction(db.transaction(), user_ref)
        gc.collect()
        return {"success": True, "remaining": new_bal}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/redeem")
async def redeem_coupon(request: Request):
    """Processes secret codes and upgrades user tiers using the case-sensitive SKV Protocol."""
    try:
        data = await request.json()
        user_id = data.get("userId")
        # Rule Change: Removed .upper() to strictly enforce mixed-case requirements
        code = data.get("code", "").strip()
        
        # Rule-Based Administrative Coupons
        coupons = { 
            # Creator Coupons (1000 Credits) - Mixed Case
            "SargamEliteCreator": 1000,
            "skvMusicMaster": 1000,
            "CreativeMindSKV": 1000,
            "NeuralArtistFlow": 1000,
            "SargamVocalStudio": 1000,
            # Pro Coupons (5000 Credits) - Mixed Case + Symbols (@, #)
            "SargamPro@#2024": 5000,
            "SKV#Pro@Neural": 5000,
            "Ultimate#Sargam@SKV": 5000,
            "Pro@#MusicMaster": 5000,
            "skv@#EliteProFlow": 5000
        }
        
        if code not in coupons: 
            return JSONResponse(status_code=404, content={"error": "Invalid or expired code."})
            
        credits_to_add = coupons[code]
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def add_credits(transaction, user_ref):
            snap = user_ref.get(transaction=transaction)
            u_data = snap.to_dict() or {}
            redeemed = u_data.get('redeemedCoupons', [])
            if code in redeemed: 
                raise Exception("This coupon has already been redeemed by this account.")
            
            # Determine new plan based on coupon value
            current_plan = u_data.get('plan', 'free')
            new_plan = current_plan
            
            if credits_to_add >= 5000:
                new_plan = 'pro'
            elif credits_to_add >= 1000:
                if current_plan != 'pro':
                    new_plan = 'creator'
            
            transaction.update(user_ref, {
                'credits': u_data.get('credits', 0) + credits_to_add,
                'redeemedCoupons': firestore.ArrayUnion([code]),
                'plan': new_plan
            })
            return True
            
        add_credits(db.transaction(), user_ref)
        return {"status": "success", "credits": credits_to_add}
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/payments/create-order")
async def create_order(request: Request):
    """Creates a real Razorpay order based on item selection."""
    try:
        data = await request.json()
        item_id = data.get("item_id")
        
        pricing_map = {
            'creator': 99,
            'pro': 299,
            'pack_20': 10,
            'pack_120': 50,
            'pack_300': 100
        }
        
        amount = pricing_map.get(item_id, 0)
        if amount == 0: raise Exception("Invalid item selected.")

        order_data = {
            "amount": amount * 100,
            "currency": "INR",
            "receipt": f"receipt_{os.urandom(4).hex()}",
            "notes": { "user_id": data.get("user_id"), "item_id": item_id }
        }
        
        order = client.order.create(data=order_data)
        return order
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/payments/verify")
async def verify_payment(request: Request):
    """Verifies Razorpay signature and provisions credits."""
    try:
        data = await request.json()
        
        params_dict = {
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        }
        
        try:
            client.utility.verify_payment_signature(params_dict)
        except Exception:
            raise Exception("Signature verification failed.")

        user_id = data.get("user_id")
        item_id = data.get("item_id")
        
        credit_map = {
            'creator': 1000,
            'pro': 5000,
            'pack_20': 20,
            'pack_120': 120,
            'pack_300': 300
        }
        
        credits_to_add = credit_map.get(item_id, 0)
        user_ref = db.collection('users').document(user_id)
        
        @firestore.transactional
        def provision_transaction(transaction, user_ref):
            snap = user_ref.get(transaction=transaction)
            u_data = snap.to_dict() or {}
            current_credits = u_data.get('credits', 0)
            
            update_fields = { 'credits': current_credits + credits_to_add }
            
            if item_id in ['creator', 'pro']:
                update_fields['plan'] = item_id
                
            transaction.update(user_ref, update_fields)
            return True
            
        provision_transaction(db.transaction(), user_ref)
        return {"status": "success", "message": "Neural credits provisioned."}
        
    except Exception as e: 
        return JSONResponse(status_code=400, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)