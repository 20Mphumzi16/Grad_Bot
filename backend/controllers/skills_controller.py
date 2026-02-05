from services.skills_service import get_skills, add_skill, delete_skill
from fastapi import APIRouter

router = APIRouter(
    prefix="/skills",
    tags=["skills"]
)

@router.get("/get-all")
def list_skills():
    try:
        skills = get_skills()
    except Exception as e:
        print(f"Error listing skills: {e}")
        return {"error": "Internal server error"}
    return skills

@router.post("/add")
def add_skill_endpoint(skill: str):
    try:
        skill = add_skill(skill)
    except Exception as e:
        print(f"Error adding skill: {e}")
        return {"error": "Internal server error"}
    return skill

@router.delete("/delete/{skill_id}")
def delete_skill_endpoint(skill_id: int):
    try:
        skill = delete_skill(skill_id)
    except Exception as e:
        print(f"Error deleting skill: {e}")
        return {"error": "Internal server error"}
    return skill
