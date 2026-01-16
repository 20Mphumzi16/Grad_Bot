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
