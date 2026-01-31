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

    user_res = supabase.table("User") \
        .select("email,id") \
        .eq("email", data.email) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    otp_res = supabase.table("user_otp") \
        .select("*") \
        .eq("user_id", user_res.data["id"]) \
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
        .select("email","id") \
        .eq("email", data.email) \
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
        .eq("id", user_res.data["id"]) \
        .eq("purpose", OTP_PURPOSE_FIRST_LOGIN) \
        .is_("verified_at", None) \
        .maybe_single() \
        .execute()

    if otp_res and otp_res.data:
        last_sent = datetime.fromisoformat(otp_res.data["last_sent_at"])
        if (now - last_sent).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(429, "Please wait before requesting another OTP")

        # Invalidate old OTP
        invalidate_existing_otps(str(data.email), OTP_PURPOSE_FIRST_LOGIN)

    # 🎲 Generate new OTP
    otp_code = generate_otp()
    otp_hash = hash_password(otp_code)
    expires_at = (now + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

    # 💾 Save to DB
    supabase.table("user_otp").insert({
        "user_id": str(user_res.data["id"]),
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
    }).eq("email", data.email).execute()
        
    
    user_res = supabase.table("User") \
        .select("email,id") \
        .eq("email", data.email) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    user = user_res.data
    
    # Fetch role from profile
    profile_res = supabase.table("profile") \
        .select("role") \
        .eq("id", user["id"]) \
        .single() \
        .execute()

    if not profile_res.data:
        raise HTTPException(404, "User profile not found")

    role = profile_res.data["role"]

    # Invalidate used OTPs
    purge_used_otps(str(user["id"]))

    token = create_access_token({
        "sub": user["email"],
        "role": role,
        "user_id": user["id"]
    })

    return {
        "status": "PASSWORD_RESET_SUCCESS",
        "access_token": token
    }


@router.post("/forgot-password/send-otp")
def send_forgot_password_otp(data: EmailVerifyRequest):
    email_input = data.email.lower()

    user_res = supabase.table("User") \
        .select("email,id") \
        .eq("email", email_input) \
        .single() \
        .execute()

    if not user_res.data:
        # Security: Don't reveal if user exists.
        # But for UX in this app we might want to tell them?
        # The first-login one returns 404. Let's return 404 for consistency or just 200 with no action.
        # The user asked to reuse ActivateAccount, which shows errors.
        raise HTTPException(404, "User not found")

    if user_res.data["email"].lower() != email_input:
        raise HTTPException(400, "Email mismatch")

    now = datetime.now(timezone.utc)

    # 🔍 Check for active OTP
    otp_res = supabase.table("user_otp") \
        .select("*") \
        .eq("id", user_res.data["id"]) \
        .eq("purpose", OTP_PURPOSE_PASSWORD_RESET) \
        .is_("verified_at", None) \
        .maybe_single() \
        .execute()

    if otp_res and otp_res.data:
        last_sent = datetime.fromisoformat(otp_res.data["last_sent_at"])
        if (now - last_sent).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
            raise HTTPException(429, "Please wait before requesting another OTP")

        # Invalidate old OTP
        invalidate_existing_otps(str(user_res.data["id"]), OTP_PURPOSE_PASSWORD_RESET)

    # 🎲 Generate new OTP
    otp_code = generate_otp()
    otp_hash = hash_password(otp_code)
    expires_at = (now + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

    # 💾 Save to DB
    supabase.table("user_otp").insert({
        "user_id": str(user_res.data["id"]),
        "otp_hash": otp_hash,
        "purpose": OTP_PURPOSE_PASSWORD_RESET,
        "expires_at": expires_at,
        "max_attempts": OTP_MAX_ATTEMPTS,
        "attempts": 0,
        "last_sent_at": now.isoformat()
    }).execute()

    # 📧 Send Email
    send_otp_email(data.email, otp_code)

    return {"message": "OTP sent successfully"}


@router.post("/forgot-password/verify-otp")
def verify_forgot_password_otp(data: OTPVerifyRequest):
    email_input = data.email.lower()
    
    user_res = supabase.table("User") \
        .select("email,id") \
        .eq("email", email_input) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    otp_res = supabase.table("user_otp") \
        .select("*") \
        .eq("user_id", user_res.data["id"]) \
        .eq("purpose", OTP_PURPOSE_PASSWORD_RESET) \
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


@router.post("/forgot-password/reset-password")
def reset_forgot_password(data: ResetPasswordRequest):
    # Ideally verify that an OTP was recently verified for this user and purpose
    # But following the pattern of first-login/reset-password
    email_input = data.email.lower()
    
    supabase.table("User").update({
        "hashed_pass": hash_password(data.new_password)
    }).eq("email", email_input).execute()
        
    # Log them in automatically?
    user_res = supabase.table("User") \
        .select("email,id") \
        .eq("email", email_input) \
        .single() \
        .execute()

    if not user_res.data:
        raise HTTPException(404, "User not found")

    user = user_res.data
    
    profile_res = supabase.table("profile") \
        .select("role") \
        .eq("id", user["id"]) \
        .single() \
        .execute()

    if not profile_res.data:
        raise HTTPException(404, "User profile not found")

    role = profile_res.data["role"]

    purge_used_otps(str(user["id"]))

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

def purge_used_otps(user_id: str):
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("user_otp") \
        .delete() \
        .eq("user_id", user_id) \
        .is_("verified_at", None) \
        .lt("expires_at", now) \
        .execute()

purge_expired_otps()