from models.branch_models import BranchCreate, BranchResponse
from db.supabase_client import supabase
import logging

def create_branch(branch: BranchCreate) -> BranchResponse:
    """Create a new branch"""
    try:
        data = supabase.table("branches").insert(branch.model.dump()).execute().data
        return BranchResponse(**data[0])
    except Exception as e:
        logging.error(f"Error creating branch: {e}")        
        raise

def get_branch_by_id(branch_id: int) -> BranchResponse:
    """Get a branch by ID"""
    try:
        data = supabase.table("branches").select("*").eq("id", branch_id).execute().data
        if not data:
            raise Exception("Branch not found")
        return BranchResponse(**data[0])
    except Exception as e:
        logging.error(f"Error fetching branch: {e}")
        raise

def delete_branch(branch_id: int) -> None:
    """Delete a branch by ID"""
    try:
        supabase.table("branches").delete().eq("id", branch_id).execute()
    except Exception as e:
        logging.error(f"Error deleting branch: {e}")
        raise
def get_branch_by_name(branch_name: str) -> BranchResponse:
    """Get a branch by name"""
    try:
        data = supabase.table("branches").select("*").eq("name", branch_name).execute().data
        if not data:
            raise Exception("Branch not found")
        return BranchResponse(**data[0])
    except Exception as e:
        logging.error(f"Error fetching branch: {e}")
        raise

def get_all_branches() -> list[BranchResponse]:
    """Get all branches"""
    try:
        data = supabase.table("branches").select("*").execute().data
        return [BranchResponse(**branch) for branch in data]
    except Exception as e:
        logging.error(f"Error fetching branches: {e}")
        raise