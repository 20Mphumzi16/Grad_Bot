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

def get_user(email: str, password: str):
    hashed_pass = password_hashing(password)
    rows = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .eq("hashed_pass", hashed_pass)
        .execute()
    ).data

    if not rows:
        return [None, "Invalid email or password"]

    log_in = rows[0]
    id = log_in["id"]
    user = get_user_id(id)
    return user

def get_user_id(id):
    try:
        user = {}
        user["id"] = id
    
        user_res = (
            supabase.table("User")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data
    
        if not user_res:
            return [None,"User not found"]
        
        log_in = user_res[0]
        
        print("Logged in user data:", log_in)
    
        user["email"] = log_in["email"]
    
        profile_res = (
            supabase.table("profile")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data

        if not profile_res:
             return [None, "Profile not found"]
        profile = profile_res[0]
    
        contact_res = (
            supabase.table("contact")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data
        
        if not contact_res:
            return [None, "Contact not found"]
        contact = contact_res[0]
    
        user["first_name"] = profile["first_name"]
        user["last_name"] = profile["last_name"]
        user["role"] = profile["role"]
        user["phone"] = contact["phone"]
    
        return user
    except Exception as e:
        print(f"Error in get_user_id: {e}")
        return [None, str(e)]

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


def update_graduate_basic(user_id: str, data: dict):
    email_update = {}
    if "email" in data:
        email_update["email"] = data["email"]
    if email_update:
        supabase.table("User").update(email_update).eq("id", user_id).execute()

    if "phone" in data:
        supabase.table("contact").update({"phone": data["phone"]}).eq("id", user_id).execute()

    profile_update = {}
    if "first_name" in data:
        profile_update["first_name"] = data["first_name"]
    if "last_name" in data:
        profile_update["last_name"] = data["last_name"]
    if "role" in data:
        profile_update["role"] = data["role"]
    if profile_update:
        supabase.table("profile").update(profile_update).eq("id", user_id).execute()

    if "progress" in data:
        supabase.table("graduates").update({"progress": data["progress"]}).eq("id", user_id).execute()

    graduates = get_all_graduates()
    for grad in graduates:
        if str(grad["id"]) == str(user_id):
            return grad
    return None


def get_all_graduates():
    try:
        graduates_rows = (
            supabase.table("graduates")
            .select("*")
            .execute()
        ).data

        graduates = []

        for grad_row in graduates_rows:
            try:
                user_id = grad_row["id"]

                user = get_user_id(user_id)

                if user is None or isinstance(user, list):
                    continue

                grad = {
                    "id": user["id"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "role": user["role"],
                    "email": user["email"],
                    "phone": user["phone"],
                    "progress": grad_row.get("progress"),
                }
                graduates.append(grad)
            except Exception as inner_e:
                print(f"Skipping graduate {grad_row.get('id')} due to error: {inner_e}")
                continue

        return graduates
    except Exception as e:
        print(f"Error in get_all_graduates: {e}")
        raise e
 
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

def delete_user(user_id: str) -> bool:
    try:
    
        try:
            print(f"Attempting to delete from graduates table for user_id: {user_id}")
            grad_del = supabase.table("User").delete().eq("id", user_id).execute()
            print(f"Deleted from User: {grad_del.data}")
        except Exception as e:
            print(f"CRITICAL ERROR deleting from User: {e}")

    
        # tables = ["contact", "profile"]
        # for table in tables:
        #     try:
        #         supabase.table(table).delete().eq("id", user_id).execute()
        #     except Exception as e:
        #         print(f"Error deleting from {table}: {e}")

    
        # response = supabase.table("User").delete().eq("id", user_id).execute()

        # if not response.data:
        #     print(f"Warning: User {user_id} not found in User table or deletion failed.")
            
        return True
    except Exception as e:
        print(f"Error in delete_user: {e}")
        raise e
