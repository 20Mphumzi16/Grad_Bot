import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from email_service import send_email, get_all_graduate_emails, get_graduate_email_by_id

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
            
            # Check if admin marked milestone as completed
            admin_completed = milestone.get("status") == "completed"

            # Build task list with completion status
            formatted_tasks = []
            completed_count = 0
            for t in m_tasks:
                # Task is completed if user marked it OR admin marked milestone as completed
                is_completed = t["id"] in completed_task_ids or admin_completed
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
        
        # Send Email Notification on Completion
        if status == 'completed':
            try:
                # Fetch milestone details to know who to email
                m_res = supabase.table("milestones").select("title, graduate_id").eq("id", milestone_id).single().execute()
                if m_res.data:
                    title = m_res.data['title']
                    grad_id = m_res.data['graduate_id']
                    
                    subject = f"Milestone Completed: {title}"
                    body = f"""
                    <h2>Milestone Completed</h2>
                    <p>The milestone <strong>{title}</strong> has been marked as completed.</p>
                    <p>Log in to view your progress: <a href="http://localhost:5173/student/timeline">View Timeline</a></p>
                    """
                    
                    if grad_id:
                        email = get_graduate_email_by_id(str(grad_id))
                        if email:
                            send_email([email], subject, body)
                    else:
                        emails = get_all_graduate_emails()
                        if emails:
                            send_email(emails, subject, body)
            except Exception as e:
                print(f"Error sending completion notification: {e}")

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

            # Send Email Notification
            try:
                subject = f"New Milestone: {title}"
                body = f"""
                <h2>New Milestone Assigned</h2>
                <p>A new milestone <strong>{title}</strong> ({week_label}) has been assigned to you.</p>
                <p>Tasks included: {len(tasks) if tasks else 0}</p>
                <p>Log in to view it: <a href="http://localhost:5173/student/timeline">View Timeline</a></p>
                """
                
                if grad_id:
                    # Specific graduate
                    email = get_graduate_email_by_id(str(grad_id))
                    if email:
                        send_email([email], subject, body)
                else:
                    # Global milestone - send to all
                    emails = get_all_graduate_emails()
                    if emails:
                        send_email(emails, subject, body)
            except Exception as e:
                print(f"Error sending milestone notification: {e}")
            
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

def update_milestone_with_tasks(milestone_id: str, title: str, week_label: str, tasks: list[dict], graduate_ids: list[UUID] | None = None):
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
        
        # Determine Primary Target (for the existing milestone) and Secondary Targets (for new copies)
        primary_target = None
        secondary_targets = []
        
        if graduate_ids:
            primary_target = str(graduate_ids[0])
            secondary_targets = graduate_ids[1:]
        
        # Update the primary milestone assignment
        update_data["graduate_id"] = primary_target

        supabase.table("milestones").update(update_data).eq("id", milestone_id).execute()

        # 2. Handle Tasks for the Primary Milestone
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

        # 3. Handle Secondary Targets (Create Copies)
        if secondary_targets:
            print(f"Creating copies for {len(secondary_targets)} secondary targets")
            # Extract task names
            task_names = [t["name"] for t in tasks]
            create_milestone_with_tasks(title, week_label, task_names, secondary_targets)

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
        # 1. Fetch all milestones to determine relevance and admin status
        milestones = supabase.table("milestones").select("*").execute().data
        
        # 2. Fetch all tasks
        tasks = supabase.table("tasks").select("*").execute().data
        
        # 3. Fetch task progress for this graduate
        progress_res = supabase.table("task_progress").select("task_id, completed").eq("graduate_id", graduate_id).eq("completed", True).execute()
        user_completed_task_ids = {item['task_id'] for item in progress_res.data} if progress_res.data else set()

        total_relevant_tasks = 0
        total_completed_tasks = 0

        # Filter relevant milestones
        relevant_milestones = []
        for m in milestones:
            # Check if milestone is assigned to specific graduate or is global (if that's the logic)
            # Assuming logic from get_graduate_milestones_with_tasks:
            assigned_to = m.get("graduate_id")
            if assigned_to and str(assigned_to) != str(graduate_id):
                continue
            relevant_milestones.append(m)

        relevant_milestone_ids = {m["id"] for m in relevant_milestones}
        
        # Map milestones to their status for quick lookup
        milestone_status_map = {m["id"]: m.get("status") for m in relevant_milestones}

        for task in tasks:
            # Only consider tasks belonging to relevant milestones
            if task["milestone_id"] not in relevant_milestone_ids:
                continue
            
            total_relevant_tasks += 1
            
            # Check completion
            is_user_completed = task["id"] in user_completed_task_ids
            is_admin_completed = milestone_status_map.get(task["milestone_id"]) == "completed"
            
            if is_user_completed or is_admin_completed:
                total_completed_tasks += 1

        if total_relevant_tasks == 0:
            return 0

        return int((total_completed_tasks / total_relevant_tasks) * 100)
    except Exception as e:
        print(f"Error calculating progress for {graduate_id}: {e}")
        return 0

def get_next_three_active_milestones(graduate_id: UUID):
    """
    Return up to 3 milestones that are still Upcoming or In-Progress for this graduate.
    No direct graduate->milestone link; we infer status via task_progress and
    also return a progress percentage per milestone.
    """
    try:
        # All milestones ordered for consistent slicing
        milestones = (
            supabase.table("milestones")
            .select("*")
            .order("display_order")
            .execute()
            .data
        )
        if not milestones:
            return []

        # All tasks (used to map task_progress -> milestones)
        tasks_res = (
            supabase.table("tasks")
            .select("id, milestone_id, name, display_order")
            .order("display_order")
            .execute()
        )
        tasks = tasks_res.data if tasks_res and tasks_res.data else []
        if not tasks:
            return []

        # Completed tasks for this graduate
        progress_res = (
            supabase.table("task_progress")
            .select("task_id, completed")
            .eq("graduate_id", str(graduate_id))
            .eq("completed", True)
            .execute()
        )
        completed_task_ids = {item["task_id"] for item in progress_res.data} if progress_res and progress_res.data else set()

        results = []
        for m in milestones:
            m_tasks = [t for t in tasks if t["milestone_id"] == m["id"]]

            if not m_tasks:
                # Milestone without tasks is treated as upcoming with 0% progress
                status = "Upcoming"
                formatted_tasks = []
                progress_pct = 0
            else:
                # Check admin status
                admin_completed = m.get("status") == "completed"
                
                if admin_completed:
                    completed_count = len(m_tasks)
                else:
                    completed_count = sum(1 for t in m_tasks if t["id"] in completed_task_ids)
                
                total_count = len(m_tasks)
                progress_pct = int((completed_count / total_count) * 100) if total_count > 0 else 0

                formatted_tasks = [
                    {
                        "task_id": t["id"],
                        "name": t["name"],
                        "completed": t["id"] in completed_task_ids or admin_completed,
                        "display_order": t.get("display_order"),
                    }
                    for t in m_tasks
                ]
                formatted_tasks.sort(key=lambda x: x["display_order"] or 0)

                status = "Upcoming"
                if completed_count == total_count:
                    status = "Completed"
                elif completed_count > 0:
                    status = "In-Progress"

            if status in ("Upcoming", "In-Progress"):
                results.append({
                    "milestone_id": m["id"],
                    "title": m["title"],
                    "week_label": m["week_label"],
                    "status": status,
                    "progress": progress_pct,  # 0–100
                    "admin_status": m.get("status"),
                    "created_at": m.get("created_at"),
                    "tasks": formatted_tasks,
                })

            if len(results) == 3:
                break

        return results
    except Exception as e:
        print(f"Error fetching next milestones for {graduate_id}: {e}")
        return []