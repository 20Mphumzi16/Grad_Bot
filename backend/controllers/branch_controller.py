import logging
from fastapi import APIRouter
from models.branch_models import BranchCreate, BranchResponse
from services.branch_service import create_branch, get_branch_by_id, get_all_branches, delete_branch, get_branch_by_name

router=APIRouter(prefix="/branch", tags=["Branches"])

@router.post("/create", response_model=BranchResponse)
async def create_branch_endpoint(branch: BranchCreate):
    try:
        return create_branch(branch)
    except Exception as e:
        logging.error(f"Error creating branch: {e}")
        return None
@router.get("/get-by-id/{branch_id}", response_model=BranchResponse)
async def get_branch_by_id_endpoint(branch_id: int):
    try:
        return get_branch_by_id(branch_id)
    except Exception as e:
        logging.error(f"Error getting branch by id: {e}")
        return None
    
@router.get("/get-all", response_model=list[BranchResponse])
async def get_all_branches_endpoint():
    try:
        return get_all_branches()
    except Exception as e:
        logging.error(f"Error getting all branches: {e}")
        return None

@router.get("/get-by-name/{branch_name}", response_model=BranchResponse)
async def get_branch_by_name_endpoint(branch_name: str):
    try:
        return get_branch_by_name(branch_name)
    except Exception as e:
        logging.error(f"Error getting branch by name: {e}")
        return None
