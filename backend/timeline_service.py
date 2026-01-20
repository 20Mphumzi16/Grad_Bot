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

import re

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
                "status": milestone.get("status", "active"),
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

def update_milestone_status(milestone_id: str, status: str):
    try:
        supabase.table("milestones").update({"status": status}).eq("id", milestone_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Error updating milestone status {milestone_id}: {e}")
        raise e

def create_milestone_with_tasks(title: str, week_label: str, tasks: list[str]):
    try:
        # 1. Parse start/end week
        nums = [int(s) for s in re.findall(r'\b\d+\b', week_label)]
        start_week = nums[0] if nums else 1
        end_week = nums[-1] if nums else start_week

        # 2. Get max display_order
        max_order_res = supabase.table("milestones").select("display_order").order("display_order", desc=True).limit(1).execute()
        next_order = 1
        if max_order_res.data:
            next_order = max_order_res.data[0]["display_order"] + 1

        # 3. Insert milestone
        milestone_id = str(uuid.uuid4())
        milestone_data = {
            "id": milestone_id,
            "title": title,
            "week_label": week_label,
            "display_order": next_order,
            "start_week": start_week,
            "end_week": end_week
        }
        print(f"Creating milestone: {milestone_data}")
        milestone_res = supabase.table("milestones").insert(milestone_data).execute()
        
        # 4. Insert tasks
        if tasks:
            tasks_data = []
            for idx, task_name in enumerate(tasks):
                tasks_data.append({
                    "id": str(uuid.uuid4()),
                    "milestone_id": milestone_id,
                    "name": task_name,
                    "display_order": idx + 1,
                    "task_type": "standard" # Default type
                })
            
            print(f"Creating tasks: {tasks_data}")
            supabase.table("tasks").insert(tasks_data).execute()
            
        return {"status": "success", "milestone_id": milestone_id}
        
    except Exception as e:
        print(f"Error creating milestone: {e}")
        
        # Rollback: Attempt to delete the milestone if task insertion failed
        if 'milestone_id' in locals():
            try:
                print(f"Rolling back milestone {milestone_id} due to error")
                supabase.table("milestones").delete().eq("id", milestone_id).execute()
            except Exception as rollback_e:
                print(f"Failed to rollback milestone: {rollback_e}")

        import traceback
        traceback.print_exc()
        raise e

def update_milestone_with_tasks(milestone_id: str, title: str, week_label: str, tasks: list[dict]):
    try:
        # 1. Update Milestone details
        # Parse start/end week
        nums = [int(s) for s in re.findall(r'\b\d+\b', week_label)]
        start_week = nums[0] if nums else 1
        end_week = nums[-1] if nums else start_week

        supabase.table("milestones").update({
            "title": title,
            "week_label": week_label,
            "start_week": start_week,
            "end_week": end_week
        }).eq("id", milestone_id).execute()

        # 2. Handle Tasks
        # Get existing tasks from DB
        existing_tasks_res = supabase.table("tasks").select("id").eq("milestone_id", milestone_id).execute()
        existing_ids = {t["id"] for t in existing_tasks_res.data} if existing_tasks_res.data else set()

        # Identify tasks from payload
        incoming_ids = {t["id"] for t in tasks if "id" in t and t["id"]}
        
        # A. Delete removed tasks
        ids_to_delete = list(existing_ids - incoming_ids)
        if ids_to_delete:
            print(f"Deleting tasks: {ids_to_delete}")
            supabase.table("tasks").delete().in_("id", ids_to_delete).execute()

        # B. Upsert (Update existing + Insert new)
        tasks_to_upsert = []
        for idx, task in enumerate(tasks):
            task_data = {
                "milestone_id": milestone_id,
                "name": task["name"],
                "display_order": idx + 1,
                "task_type": "standard"
            }
            if "id" in task and task["id"]:
                task_data["id"] = task["id"] # Update existing
            else:
                task_data["id"] = str(uuid.uuid4()) # Create new
            
            tasks_to_upsert.append(task_data)

        if tasks_to_upsert:
            print(f"Upserting tasks: {len(tasks_to_upsert)}")
            supabase.table("tasks").upsert(tasks_to_upsert).execute()

        return {"status": "success"}

    except Exception as e:
        print(f"Error updating milestone {milestone_id}: {e}")
        import traceback
        traceback.print_exc()
        raise e

def delete_milestone(milestone_id: str):
    try:
        # Deleting milestone will cascade delete tasks due to FK constraint
        response = supabase.table("milestones").delete().eq("id", milestone_id).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting milestone {milestone_id}: {e}")
        raise e

def delete_all_milestones():
    try:
        # Fetch all milestone IDs first to safely delete them
        res = supabase.table("milestones").select("id").execute()
        if res.data:
            ids = [item['id'] for item in res.data]
            supabase.table("milestones").delete().in_("id", ids).execute()
            
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting all milestones: {e}")
        raise e


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
