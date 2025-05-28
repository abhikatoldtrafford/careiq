# test_firebase.py
import firebase_admin
from firebase_admin import credentials

try:
    cred = credentials.Certificate("firebase_admin_key.json")
    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin SDK connected successfully!")
except Exception as e:
    print(f"❌ Error: {e}")