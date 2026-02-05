from services.graduate_skill_service import update_graduate_skill
from services.graduate_skill_service import get_graduate_skills, add_graduate_skill, delete_graduate_skill
from fastapi import APIRouter
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/graduate_skills",
    tags=["graduate_skills"]
)

class AddSkillRequest(BaseModel):
    graduate_id: UUID
    skill_id: int
    source: Optional[str] = None
    where_used: Optional[str] = None

class UpdateSkillRequest(BaseModel):
    graduate_id: UUID
    skill_id: int
    source: Optional[str] = None
    where_used: Optional[str] = None

@router.post("/add")
def add_graduate_skill_endpoint(request: AddSkillRequest):
    return add_graduate_skill(request.graduate_id, request.skill_id, request.source, request.where_used)

@router.delete("/delete/{graduate_id}/{skill_id}")
def delete_graduate_skill_endpoint(graduate_id: UUID, skill_id: int):
    return delete_graduate_skill(graduate_id, skill_id)

@router.get("/get-all/{graduate_id}")
def get_graduate_skills_endpoint(graduate_id: UUID):
    return get_graduate_skills(graduate_id)

@router.put("/update")
def update_graduate_skill_endpoint(request: UpdateSkillRequest):
    return update_graduate_skill(request.graduate_id, request.skill_id, request.source, request.where_used) 