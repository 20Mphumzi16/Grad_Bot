import logging
from fastapi import APIRouter
from models.department_models import DepartmentCreate, DepartmentResponse
from services.department_service import create_department, get_department_by_id, get_all_departments, get_department_by_name

router = APIRouter(prefix="/department", tags=["Department"])

@router.post("/create", response_model=DepartmentResponse)
async def create_department_endpoint(request: DepartmentCreate):
    try:
        department = create_department(
            name=request.name,
        )
        return department   
    
    except Exception as e:
        logging.error(f"Error creating department: {e}")
        return None

@router.get("/get-all", response_model=list[DepartmentResponse])
async def get_all_departments_endpoint():
    try:
        departments = get_all_departments()
        return departments
    except Exception as e:
        logging.error(f"Error getting all departments: {e}")
        return None

@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department_endpoint(department_id: int):
    try:
        department = get_department_by_id(department_id)
        return department
    except Exception as e:
        logging.error(f"Error getting department: {e}")
        return None
    
@router.delete("/{department_id}")
async def delete_department_endpoint(department_id: int):
    try:
        delete_department(department_id)
        return {"message": "Department deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting department: {e}")
        return None
    
    
@router.get("/get-by-name/{department_name}", response_model=DepartmentResponse)
async def get_department_by_name_endpoint(department_name: str):
    try:
        department = get_department_by_name(department_name)
        return department
    except Exception as e:
        logging.error(f"Error getting department by name: {e}")
        return None

