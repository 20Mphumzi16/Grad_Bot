# backend/graduate_routes.py
from fastapi import APIRouter
from pydantic import BaseModel
from uuid import UUID
from timeline_service import complete_task, get_graduate_milestones_with_tasks, uncomplete_task

router = APIRouter(prefix="/timeline", tags=["Timeline"])

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