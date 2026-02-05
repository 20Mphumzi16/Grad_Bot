from services.skills_service import get_skill
from db.supabase_client import supabase
from uuid import UUID

def get_graduate_skills(graduate_id: UUID):
    try:
        res = supabase.table("graduate_skills").select("*").eq("user_id", str(graduate_id)).execute()
    except Exception as e:
        print(f"Error getting graduate skills: {e}")
        return None
    
    return res.data

def update_graduate_skill(graduate_id: UUID, skill_id: int, source: str = None, where_used: str = None):
    try:
        res = supabase.table("graduate_skills").update({
            "source": source,
            "where_used": where_used
        }).eq("user_id", str(graduate_id)).eq("skill_id", skill_id).execute()
    except Exception as e:
        print(f"Error updating graduate skill: {e}")
        return None
    return res.data


def delete_graduate_skill(graduate_id: UUID, skill_id: int):
    try:
        res = supabase.table("graduate_skills").delete().eq("user_id", str(graduate_id)).eq("skill_id", skill_id).execute()
    except Exception as e:
        print(f"Error deleting graduate skill: {e}")
        return None
    return res.data

def add_graduate_skill(graduate_id: UUID, skill_id: int, source: str = None, where_used: str = None):
    
    print(graduate_id, skill_id, source, where_used)

    skill = get_skill(skill_id)
    if not skill:
        print(f"Skill with ID {skill_id} does not exist")
        return None
    
    try:
        existing = supabase.table("graduate_skills").select("skill_id").eq("user_id", str(graduate_id)).eq("skill_id", skill_id).execute()
        if existing.data:
            print(f"Skill {skill_id} already exists for user {graduate_id}")
            # Optionally update source/where_used here if needed, or just return existing
            return existing.data

        row = {
            "user_id": str(graduate_id),
            "skill_id": skill_id,
            "source": source,
            "where_used": where_used
        }
        res = supabase.table("graduate_skills").insert([row]).execute()
        return res.data
    
    except Exception as e:
        print(f"Error adding graduate skill: {e}")
        return None
