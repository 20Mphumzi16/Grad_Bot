import hashlib
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def password_hashing(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def user_exists(email: str) -> bool:
    user = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .execute()
    ).data
    return bool(user)

def new_user(email, role, first_name, last_name, password, phone=""):
    if user_exists(email):
        return [None, "User already exists"]

    hashed_password = password_hashing(password)

    response = (
        supabase.table("User")
        .insert({
            "email": email,
            "role": role,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "hashed_pass": hashed_password
        })
        .execute()
    ).data

    return response

def get_user(email: str, password: str):
    hashed_pass = password_hashing(password)

    user = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .eq("hashed_pass", hashed_pass)
        .execute()
    ).data

    if not user:
        return [None,"Invalid email or password"]

    return user
