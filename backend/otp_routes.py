from fastapi import  APIRouter, HTTPException
from uuid import UUID
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta, timezone
from otp_request_models import EmailVerifyRequest,ResetPasswordRequest,OTPVerifyRequest
from security import hash_password ,generate_otp,verify_password
from email_service import send_otp_email
from jwt_utils import create_access_token, decode_token
load_dotenv()


url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_PURPOSE_FIRST_LOGIN="first_login"
OTP_PURPOSE_PASSWORD_RESET="password_reset"

router = APIRouter(prefix="/otp", tags=["One Time Pin"])

def invalidate_existing_otps(user_id: str, purpose: str):
    supabase.table("user_otp") \
        .update({"verified_at": datetime.now(timezone.utc).isoformat()}) \
        .eq("user_id", user_id) \
        .eq("purpose", purpose) \
        .is_("verified_at", None) \
        .execute()

@router.post("/first-login/verify-otp")
def verify_otp(data: OTPVerifyRequest):
    otp_res = supabase.table("user_otp") \
        .select("*") \
        .eq("user_id", data.user_id) \
        .eq("purpose", OTP_PURPOSE_FIRST_LOGIN) \
        .is_("verified_at", None) \
        .single() \
        .execute()

    if not otp_res.data:
        raise HTTPException(400, "No active OTP found")

    otp_row = otp_res.data
    now = datetime.now(timezone.utc)

    if now > datetime.fromisoformat(otp_row["expires_at"]):
        raise HTTPException(400, "OTP expired")

    if otp_row["attempts"] >= otp_row["max_attempts"]:
        raise HTTPException(429, "Too many attempts. Request a new OTP.")

    if not verify_password(data.otp, otp_row["otp_hash"]):
        supabase.table("user_otp") \
            .update({"attempts": otp_row["attempts"] + 1}) \
            .eq("id", otp_row["id"]) \
            .execute()

        raise HTTPException(400, "Invalid OTP")

    # ✅ Mark OTP as used (reuse protection)
    supabase.table("user_otp") \
        .update({"verified_at": now.isoformat()}) \
        .eq("id", otp_row["id"]) \
        .execute()

    return {"status": "OTP_VERIFIED"}


@router.post("/first-login/send-otp")
def send_otp(data: EmailVerifyRequest):
    user_res = supabase.table("User") \
        .select("id,email") \
        .eq("id", data.user_id) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    if user_res.data["email"] != data.email:
        raise HTTPException(400, "Email mismatch")

    now = datetime.now(timezone.utc)

    # 🔍 Check for active OTP
    otp_res = supabase.table("user_otp") \
        .select("*") \
        .eq("user_id", data.user_id) \
        .eq("purpose", OTP_PURPOSE_FIRST_LOGIN) \
        .is_("verified_at", None) \
        .maybe_single() \
        .execute()

    if otp_res and otp_res.data:
        last_sent = datetime.fromisoformat(otp_res.data["last_sent_at"])
        if (now - last_sent).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(429, "Please wait before requesting another OTP")

        # Invalidate old OTP
        invalidate_existing_otps(str(data.user_id), OTP_PURPOSE_FIRST_LOGIN)

    # 🎲 Generate new OTP
    otp_code = generate_otp()
    otp_hash = hash_password(otp_code)
    expires_at = (now + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

    # 💾 Save to DB
    supabase.table("user_otp").insert({
        "user_id": str(data.user_id),
        "otp_hash": otp_hash,
        "purpose": OTP_PURPOSE_FIRST_LOGIN,
        "expires_at": expires_at,
        "max_attempts": OTP_MAX_ATTEMPTS,
        "attempts": 0,
        "last_sent_at": now.isoformat()
    }).execute()

    # 📧 Send Email
    send_otp_email(data.email, otp_code)

    return {"message": "OTP sent successfully"}

@router.post("/first-login/reset-password")
def reset_password(data: ResetPasswordRequest):
    supabase.table("User").update({
        "hashed_pass": hash_password(data.new_password),
        "must_reset_password": False
    }).eq("id", data.user_id).execute()
        
    
    user_res = supabase.table("User") \
        .select("id,email") \
        .eq("id", data.user_id) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    user = user_res.data
    
    # Fetch role from profile
    profile_res = supabase.table("profile") \
        .select("role") \
        .eq("id", data.user_id) \
        .single() \
        .execute()

    if not profile_res.data:
        raise HTTPException(404, "User profile not found")

    role = profile_res.data["role"]

    token = create_access_token({
        "sub": user["email"],
        "role": role,
        "user_id": user["id"]
    })

    return {
        "status": "PASSWORD_RESET_SUCCESS",
        "access_token": token
    }

def purge_expired_otps():
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("user_otp") \
        .delete() \
        .lt("expires_at", now) \
        .execute()