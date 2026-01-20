import os
import uuid
from datetime import datetime
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
    try:
        # 1. Fetch all milestones
        milestones = supabase.table("milestones").select("*").order("display_order").execute().data
        
        # 2. Fetch all tasks
        tasks = supabase.table("tasks").select("*").order("display_order").execute().data
        
        # 3. Fetch task progress for this graduate
        progress_res = supabase.table("task_progress").select("task_id, completed").eq("graduate_id", graduate_id).eq("completed", True).execute()
        completed_task_ids = {item['task_id'] for item in progress_res.data} if progress_res.data else set()

        result = []
        for milestone in milestones:
            # Check if milestone is assigned to specific graduate
            assigned_to = milestone.get("graduate_id")
            if assigned_to and str(assigned_to) != str(graduate_id):
                continue

            m_tasks = [t for t in tasks if t["milestone_id"] == milestone["id"]]
            
            # Build task list with completion status
            formatted_tasks = []
            completed_count = 0
            for t in m_tasks:
                is_completed = t["id"] in completed_task_ids
                if is_completed:
                    completed_count += 1
                formatted_tasks.append({
                    "task_id": t["id"],
                    "name": t["name"],
                    "completed": is_completed,
                    "display_order": t["display_order"]
                })
            
            # Sort tasks by display_order
            formatted_tasks.sort(key=lambda x: x["display_order"])
            
            # Determine Status
            status = "Upcoming"
            if m_tasks:
                if completed_count == len(m_tasks):
                    status = "Completed"
                elif completed_count > 0:
                    status = "In-Progress"
            
            result.append({
                "milestone_id": milestone["id"],
                "title": milestone["title"],
                "week_label": milestone["week_label"],
                "status": status,
                "admin_status": milestone.get("status"), # Pass admin status
                "created_at": milestone.get("created_at"),
                "tasks": formatted_tasks
            })
            
        return result

    except Exception as e:
        print(f"Error fetching graduate timeline: {e}")
        return []

def complete_task(graduate_id: UUID, task_id: UUID):
    try:
        # 1. Try to update existing record
        res = supabase.table("task_progress").update({
            "completed": True,
            "completed_at": datetime.utcnow().isoformat()
        }).eq("graduate_id", str(graduate_id)).eq("task_id", str(task_id)).execute()
        
        # 2. If no record updated (list is empty), insert new one
        if not res.data:
            data = {
                "graduate_id": str(graduate_id),
                "task_id": str(task_id),
                "completed": True,
                "completed_at": datetime.utcnow().isoformat()
            }
            supabase.table("task_progress").insert(data).execute()
            
        return {"status": "success"}
    except Exception as e:
        print(f"Error completing task: {e}")
        raise e

def uncomplete_task(graduate_id: UUID, task_id: UUID):
    try:
        # Update completed to False
        supabase.table("task_progress").update({"completed": False}).eq("graduate_id", str(graduate_id)).eq("task_id", str(task_id)).execute()
        return {"status": "success"}
    except Exception as e:
        print(f"Error uncompleting task: {e}")
        raise e

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
                "created_at": milestone.get("created_at"),
                "graduate_id": milestone.get("graduate_id"),
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

def create_milestone_with_tasks(title: str, week_label: str, tasks: list[str], graduate_ids: list[UUID] | None = None):
    try:
        # 1. Parse start/end week
        nums = [int(s) for s in re.findall(r'\b\d+\b', week_label)]
        start_week = nums[0] if nums else 1
        end_week = nums[-1] if nums else start_week

        # Determine target list
        # If graduate_ids is None or Empty, we default to [None] (Global Milestone)
        targets = graduate_ids if graduate_ids else [None]
        created_ids = []

        for grad_id in targets:
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
                "end_week": end_week,
                "created_at": datetime.utcnow().isoformat(),
                "graduate_id": str(grad_id) if grad_id else None
            }
            print(f"Creating milestone: {milestone_data}")
            supabase.table("milestones").insert(milestone_data).execute()
            
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
            
            created_ids.append(milestone_id)
            
        return {"status": "success", "milestone_ids": created_ids}
        
    except Exception as e:
        print(f"Error creating milestone: {e}")
        
        # Partial Rollback attempt (best effort)
        if 'created_ids' in locals() and created_ids:
            try:
                print(f"Rolling back milestones {created_ids} due to error")
                supabase.table("milestones").delete().in_("id", created_ids).execute()
            except Exception as rollback_e:
                print(f"Failed to rollback milestones: {rollback_e}")

        import traceback
        traceback.print_exc()
        raise e

def update_milestone_with_tasks(milestone_id: str, title: str, week_label: str, tasks: list[dict], graduate_id: UUID | None = None):
    try:
        # 1. Update Milestone details
        # Parse start/end week
        nums = [int(s) for s in re.findall(r'\b\d+\b', week_label)]
        start_week = nums[0] if nums else 1
        end_week = nums[-1] if nums else start_week

        update_data = {
            "title": title,
            "week_label": week_label,
            "start_week": start_week,
            "end_week": end_week
        }
        
        # Only update graduate_id if provided (or explicitly None if that's the intent, 
        # but here we assume the payload contains the new state, so we update it)
        # Note: If the frontend sends null, we update it to null (unassign).
        update_data["graduate_id"] = str(graduate_id) if graduate_id else None

        supabase.table("milestones").update(update_data).eq("id", milestone_id).execute()

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
