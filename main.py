
import os
import uuid
import razorpay
from datetime import datetime, timezone
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables from .env file
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

app = Flask(__name__)
# This allows your Next.js site to talk to this Python server directly
CORS(app) 

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

@app.route("/")
def home():
    return jsonify({"status": "Sargam Neural Engine Active", "version": "2.4.0"})

@app.route("/health")
def health():
    return jsonify({"ready": True, "database": db is not None, "payments": client is not None})

@app.route("/api/credits/status/<user_id>", methods=['GET'])
def get_status(user_id):
    """Pings user status and resets daily credits if necessary."""
    if not db:
        return jsonify({"error": "Database offline"}), 500
    
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404
    
    data = user_doc.to_dict()
    plan = data.get('plan', 'free')
    credits = data.get('credits', 0)
    last_reset = data.get('lastReset')
    
    now = datetime.now(timezone.utc)
    should_reset = False
    
    if not last_reset:
        should_reset = True
    else:
        last_reset_dt = last_reset
        if not isinstance(last_reset, datetime):
            try:
                if hasattr(last_reset, 'to_datetime'):
                    last_reset_dt = last_reset.to_datetime()
                else:
                    last_reset_dt = datetime.fromisoformat(str(last_reset).replace('Z', '+00:00'))
            except:
                last_reset_dt = now
        
        if (now - last_reset_dt).days >= 1:
            should_reset = True
            
    if should_reset:
        credits = PLAN_LIMITS.get(plan, 5)
        user_ref.update({
            'credits': credits,
            'lastReset': now
        })
        
    return jsonify({
        "userId": user_id,
        "plan": plan,
        "credits": credits,
        "limit": PLAN_LIMITS.get(plan)
    })

@app.route("/api/credits/use", methods=['POST'])
def use_credits():
    """Deducts credits from user account."""
    if not db:
        return jsonify({"error": "Database offline"}), 500
        
    req = request.json
    user_id = req.get('user_id')
    amount = req.get('amount')

    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404
        
    current_credits = user_doc.to_dict().get('credits', 0)
    
    if current_credits < amount:
        return jsonify({"error": "Insufficient credits"}), 402
        
    user_ref.update({'credits': current_credits - amount})
    return jsonify({"status": "success", "remaining": current_credits - amount})

@app.route('/api/create-order', methods=['POST'])
def create_order():
    """Creates a Razorpay order for a specific credit pack or subscription."""
    if not client:
        return jsonify({"error": "Razorpay service unavailable"}), 503

    req = request.json
    user_id = req.get('user_id')
    item_id = req.get('item_id')
    order_type = req.get('type') # 'pack' or 'plan'

    amount_in_paise = 0
    if order_type == "pack":
        item = CREDIT_PACKS.get(item_id)
        if item:
            amount_in_paise = item["price"] * 100
    elif order_type == "plan":
        item = SUBSCRIPTIONS.get(item_id)
        if item:
            amount_in_paise = item["price"] * 100
    
    if amount_in_paise == 0:
        return jsonify({"error": "Invalid item or zero price configured"}), 400

    order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"receipt_{uuid.uuid4().hex[:6]}",
        "notes": {
            "userId": user_id,
            "itemId": item_id,
            "type": order_type
        }
    }
    
    try:
        order = client.order.create(data=order_data)
        return jsonify(order)
    except Exception as e:
        print(f"RAZORPAY ORDER ERROR: {e}")
        return jsonify({"error": f"Razorpay API error: {str(e)}"}), 500

@app.route('/api/verify', methods=['POST'])
def verify_payment():
    """Verifies Razorpay signature and updates user credits/plan."""
    if not client:
        return jsonify({"error": "Razorpay service unavailable"}), 503

    req = request.json
    params_dict = {
        'razorpay_order_id': req.get('razorpay_order_id'),
        'razorpay_payment_id': req.get('razorpay_payment_id'),
        'razorpay_signature': req.get('razorpay_signature')
    }

    try:
        client.utility.verify_payment_signature(params_dict)
    except Exception:
        return jsonify({"error": "Invalid payment signature"}), 400

    if not db:
        return jsonify({"error": "Database offline"}), 500

    user_id = req.get('user_id')
    item_id = req.get('item_id')
    order_type = req.get('type')

    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    if order_type == "pack":
        pack_data = CREDIT_PACKS.get(item_id)
        if pack_data:
            user_ref.update({
                'credits': firestore.Increment(pack_data['credits'])
            })
    elif order_type == "plan":
        plan_data = SUBSCRIPTIONS.get(item_id)
        if plan_data:
            user_ref.update({
                'plan': item_id,
                'credits': plan_data['credits'],
                'lastReset': datetime.now(timezone.utc)
            })

    return jsonify({"status": "success", "message": "Payment verified and account updated"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
