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

# def new_user(email, role, first_name, last_name, password, phone=""):
#     if user_exists(email):
#         return [None, "User already exists"]

#     hashed_password = password_hashing(password)

#     response = (
#         supabase.table("User")
#         .insert({
#             "email": email,
#             "role": role,
#             "first_name": first_name,
#             "last_name": last_name,
#             "phone": phone,
#             "hashed_pass": hashed_password
#         })
#         .execute()
#     ).data

#     return response

def get_user(email: str, password: str):
    user = {}
    hashed_pass = password_hashing(password)
 
    log_in = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .eq("hashed_pass", hashed_pass)
        .execute()
    ).data[0]
 
    if not log_in:
        return [None,"Invalid email or password"]
    
    print("Logged in user data:", log_in)
 
    user["id"] = log_in["id"]
    user["email"] = log_in["email"]
 
    profile = (
        supabase.table("profile")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data[0]
 
    contact = (
        supabase.table("contact")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data[0]
   
    user["first_name"] = profile["first_name"]
    user["last_name"] = profile["last_name"]
    user["role"] = profile["role"]
    user["phone"] = contact["phone"]
 
    return user

def update_user(user):
    user_id = user["id"]
 
    user_db = (
        supabase.table("User")
        .update({
            "email": user["email"],
        })
        .eq("id", user_id)
        .execute()
    ).data
 
    if not user_db:
        raise ValueError("User not found")

    contact_db = (
        supabase.table("contact")
        .update({
            "phone": user["phone"]
        })
        .eq("id", user_id)
        .execute()
    ).data
 
    profile_db = (
        supabase.table("profile")
        .update({
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "branch": user["branch"],
            "department": user["department"],
            "role": user["role"]
        })
        .eq("id", user_id)
        .execute()
    ).data
 
    if user["role"].lower() == "graduate":
 
        grad_db = (
            supabase.table("graduates")
            .update({
                "start_date": user["start_date"],
                "bio": user["bio"],
                "linkedin_link": user["linkedin_link"],
                "github_link": user["github_link"],
            })
            .eq("id", user_id)
            .execute()
        ).data
 
    else:
        admin_db = (
            supabase.table("admins")
            .update({
                "position": user["position"],
            })
            .eq("id", user_id)
            .execute()
        ).data
 
    return user_id
 

 
def new_user(email, role, first_name, last_name, password, phone=""):
    if user_exists(email):
        return [None, "User already exists"]
 
    hashed_password = password_hashing(password)
 
    response = (
        supabase.rpc("new_user", {
            "p_email": email,
            "p_role": role,
            "p_first_name": first_name,
            "p_last_name": last_name,
            "p_phone": phone,
            "p_hashed_password": hashed_password,
            },
        ).execute()
    ).data
    
    return response
 
