import secrets
import hashlib
from datetime import datetime, timedelta, timezone

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):08d}"


def otp_expiry(minutes: int = 10):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
