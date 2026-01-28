import hashlib
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from timeline_service import calculate_graduate_progress

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
        flag = log_in.get("must_reset_password", False)
        if isinstance(flag, str):
            user["must_reset_password"] = flag.strip().lower() in ("true", "1", "t", "yes", "y")
        elif isinstance(flag, (int, bool)):
            user["must_reset_password"] = bool(flag)
        else:
            user["must_reset_password"] = False
    
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
            "avatar_url": user["avatar_url"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "branch": user["branch"],
            "emp_no": user["emp_no"],
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
    if "avatar_url" in data:
        profile_update["avatar_url"] = data["avatar_url"]
    if "first_name" in data:
        profile_update["first_name"] = data["first_name"]
    if "last_name" in data:
        profile_update["last_name"] = data["last_name"]
    if "role" in data:
        profile_update["role"] = data["role"]

    if "emp_no" in data:
        profile_update["emp_no"] = data["emp_no"]
        
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
        # 1. Fetch base graduate list
        graduates_rows = supabase.table("graduates").select("*").execute().data
        if not graduates_rows:
            return []
            
        grad_ids = [g['id'] for g in graduates_rows]

        # 2. Bulk fetch related data
        # Fetching in chunks if necessary, but assuming < 1000 users for now
        users = supabase.table("User").select("id, email").in_("id", grad_ids).execute().data
        profiles = supabase.table("profile").select("id, first_name, last_name, role").in_("id", grad_ids).execute().data
        contacts = supabase.table("contact").select("id, phone").in_("id", grad_ids).execute().data
        
        # 3. Progress Calculation (Bulk)
        # Fetch all milestones to determine relevance and admin status
        milestones = supabase.table("milestones").select("id, status, graduate_id").execute().data
        milestone_map = {m['id']: m for m in milestones}
        admin_completed_milestone_ids = {m['id'] for m in milestones if m.get('status') == 'completed'}
        
        # Fetch all tasks
        all_tasks = supabase.table("tasks").select("id, milestone_id").execute().data
        
        # Fetch user progress for these graduates
        user_progress = supabase.table("task_progress").select("graduate_id, task_id").eq("completed", True).in_("graduate_id", grad_ids).execute().data
        
        # Build Lookups
        user_map = {u['id']: u for u in users}
        profile_map = {p['id']: p for p in profiles}
        contact_map = {c['id']: c for c in contacts}
        
        # Map graduate_id -> set of completed task_ids (user checked)
        grad_completed_tasks = {}
        for p in user_progress:
            gid = p['graduate_id']
            if gid not in grad_completed_tasks:
                grad_completed_tasks[gid] = set()
            grad_completed_tasks[gid].add(p['task_id'])

        graduates = []

        for grad_row in graduates_rows:
            try:
                gid = grad_row["id"]
                
                # Join Data
                u = user_map.get(gid, {})
                p = profile_map.get(gid, {})
                c = contact_map.get(gid, {})
                
                # Calculate Progress
                # Filter relevant milestones for this grad
                relevant_milestones = [
                    m for m in milestones 
                    if m.get('graduate_id') is None or str(m.get('graduate_id')) == str(gid)
                ]
                relevant_m_ids = {m['id'] for m in relevant_milestones}
                
                relevant_tasks = [t for t in all_tasks if t['milestone_id'] in relevant_m_ids]
                total_relevant = len(relevant_tasks)
                
                completed_count = 0
                user_checked = grad_completed_tasks.get(gid, set())
                
                for t in relevant_tasks:
                    mid = t['milestone_id']
                    # Admin completed OR User completed
                    if mid in admin_completed_milestone_ids or t['id'] in user_checked:
                        completed_count += 1
                        
                progress = int((completed_count / total_relevant * 100)) if total_relevant > 0 else 0

                grad = {
                    "id": gid,
                    "first_name": p.get("first_name", ""),
                    "last_name": p.get("last_name", ""),
                    "role": p.get("role", "Graduate"),
                    "email": u.get("email", ""),
                    "phone": c.get("phone", ""),
                    "progress": progress,
                    "archived": grad_row.get("archived", False),
                }
                graduates.append(grad)
            except Exception as inner_e:
                print(f"Skipping graduate {grad_row.get('id')} due to error: {inner_e}")
                continue

        return graduates
    except Exception as e:
        print(f"Error in get_all_graduates: {e}")
        raise e

def set_graduate_archived_status(user_id: str, archived: bool):
    try:
        response = (
            supabase.table("graduates")
            .update({"archived": archived})
            .eq("id", user_id)
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"Error setting archive status: {e}")
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
