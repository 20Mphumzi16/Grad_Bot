import os
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

from uuid import UUID


async def get_graduate_milestones_with_tasks(graduate_id):
    """
    Fetch milestones with their tasks, progress, and status for a given graduate.
    """

    return supabase.rpc(
        "get_graduate_timeline",
        {"p_graduate_id": str(graduate_id)}
    ).execute().data

def complete_task(graduate_id: UUID, task_id: UUID):
    response = (
        supabase.rpc(
            "complete_task",
            {
                "p_graduate_id": str(graduate_id),
                "p_task_id": str(task_id),
            },
        )
        .execute()
    )

    if response.data is None and response.error:
        raise Exception(response.error.message)

    return {"status": "success"}

def uncomplete_task(graduate_id: UUID, task_id: UUID):
    response = (
        supabase.rpc(
            "uncomplete_task",
            {
                "p_graduate_id": str(graduate_id),
                "p_task_id": str(task_id),
            },
        )
        .execute()
    )

    if response.data is None and response.error:
        raise Exception(response.error.message)

    return {"status": "success"}

def get_all_milestones():
    """
    Fetch all milestones with their tasks for admin view.
    """
    try:
        # 1. Fetch all milestones
        milestones = supabase.table("milestones").select("*").order("display_order").execute().data
        
        # 2. Fetch all tasks
        tasks = supabase.table("tasks").select("*").order("display_order").execute().data
        
        # 3. Group tasks by milestone
        result = []
        for milestone in milestones:
            milestone_tasks = [t for t in tasks if t["milestone_id"] == milestone["id"]]
            result.append({
                "milestone_id": milestone["id"],
                "title": milestone["title"],
                "week_label": milestone["week_label"],
                "status": "Admin View", # Admins see static view
                "tasks": [{
                    "task_id": t["id"],
                    "name": t["name"],
                    "completed": False # No completion context for admin
                } for t in milestone_tasks]
            })
            
        return result
    except Exception as e:
        print(f"Error fetching all milestones: {e}")
        return []

def calculate_graduate_progress(graduate_id: str) -> int:
    try:
        # Total tasks in the system
        total_tasks = supabase.table("tasks").select("*", count="exact").execute().count
        
        if total_tasks == 0:
            return 0

        # Completed tasks for this graduate
        completed_tasks = (
            supabase.table("task_progress")
            .select("*", count="exact")
            .eq("graduate_id", graduate_id)
            .eq("completed", True)
            .execute()
        ).count

        return int((completed_tasks / total_tasks) * 100)
    except Exception as e:
        print(f"Error calculating progress for {graduate_id}: {e}")
        return 0
