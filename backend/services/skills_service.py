from db.supabase_client import supabase

def get_skills():
    try:
        res = supabase.table("skills").select("*").execute()
    except Exception as e:
        print(f"Error getting skills: {e}")
        return []
    
    return res.data

def get_skill(skill_id: int):
    try:
        res = supabase.table("skills").select("*").eq("id", skill_id).execute()
    except Exception as e:
        print(f"Error getting skill: {e}")
        return None
    
    return res.data[0] if res.data else None

def add_skill(skill: str):
    try:
        res = supabase.table("skills").insert({"skill": skill}).execute()
    except Exception as e:
        print(f"Error adding skill: {e}")
        return None
    
    return res.data

def delete_skill(skill_id: int):
    try:
        res = supabase.table("skills").delete().eq("id", skill_id).execute()
    except Exception as e:
        print(f"Error deleting skill: {e}")
        return None
    
    return res.data