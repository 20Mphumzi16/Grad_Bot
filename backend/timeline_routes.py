# backend/graduate_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID
from timeline_service import complete_task, get_graduate_milestones_with_tasks, uncomplete_task, get_all_milestones, create_milestone_with_tasks, delete_milestone, delete_all_milestones, update_milestone_status, update_milestone_with_tasks

router = APIRouter(prefix="/timeline", tags=["Timeline"])

@router.get("/all")
async def fetch_all_milestones():
    """
    Fetch all milestones for admin management.
    """
    return get_all_milestones()

@router.delete("/all")
def remove_all_milestones():
    try:
        return delete_all_milestones()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/milestone/{milestone_id}")
def remove_milestone(milestone_id: str):
    try:
        return delete_milestone(milestone_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateMilestoneRequest(BaseModel):
    title: str
    week_label: str
    tasks: list[str]
    graduate_id: UUID | None = None
    graduate_ids: list[UUID] | None = None

@router.post("/milestone")
def create_milestone(payload: CreateMilestoneRequest):
    try:
        # Prioritize graduate_ids, fallback to graduate_id if present
        ids = payload.graduate_ids
        if not ids and payload.graduate_id:
            ids = [payload.graduate_id]
            
        return create_milestone_with_tasks(payload.title, payload.week_label, payload.tasks, ids)
    except Exception as e:
        print(f"API Error creating milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class UpdateMilestoneStatusRequest(BaseModel):
    status: str

class TaskItem(BaseModel):
    id: str | None = None
    name: str

class UpdateMilestoneRequest(BaseModel):
    title: str
    week_label: str
    tasks: list[TaskItem]
    graduate_id: UUID | None = None

@router.put("/milestone/{milestone_id}")
def update_milestone(milestone_id: str, payload: UpdateMilestoneRequest):
    try:
        # Convert Pydantic models to dicts for the service
        tasks_dicts = [t.dict() for t in payload.tasks]
        return update_milestone_with_tasks(milestone_id, payload.title, payload.week_label, tasks_dicts, payload.graduate_id)
    except Exception as e:
        print(f"API Error updating milestone: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/milestone/{milestone_id}/status")
def update_status(milestone_id: str, payload: UpdateMilestoneStatusRequest):
    try:
        return update_milestone_status(milestone_id, payload.status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{graduate_id}/milestones-tasks")
async def fetch_milestones_with_tasks(graduate_id: UUID):
    """
    Fetch milestones and tasks with progress for a graduate.
    """
    return await get_graduate_milestones_with_tasks(graduate_id)

class TaskUpdate(BaseModel):
    graduate_id: UUID
    task_id: UUID

@router.post("/tasks/complete")
def complete(payload: TaskUpdate):
    return complete_task(payload.graduate_id, payload.task_id)

@router.post("/tasks/uncomplete")
def uncomplete(payload: TaskUpdate):
    return uncomplete_task(payload.graduate_id, payload.task_id)