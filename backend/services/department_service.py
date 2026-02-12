import logging
from models.department_models import DepartmentCreate, DepartmentResponse
from db.supabase_client import supabase

def create_department(department: DepartmentCreate) -> DepartmentResponse:
    """Create a new department"""
    try:
        insert_data = department.model_dump()
        result = supabase.table("departments").insert(insert_data).execute()
        if not result.data:
            raise Exception("Failed to create department")
        return DepartmentResponse(**result.data[0])
    except Exception as e:
        logging.error(f"Error creating department: {e}")
        raise   
        print(f"Error creating department: {e}")
        raise

def update_department(department_id: int, department: DepartmentCreate) -> DepartmentResponse:
    """Update a department by ID"""
    try:
        update_data = department.model_dump()
        result = supabase.table("departments").update(update_data).eq("id", department_id).execute()
        if not result.data:
            raise Exception("Failed to update department")
        return DepartmentResponse(**result.data[0])
    except Exception as e:
        logging.error(f"Error updating department: {e}")
        raise
    

def get_department_by_id(department_id: int) -> DepartmentResponse:
    """Get a department by ID"""
    try:
        data = supabase.table("departments").select("*").eq("id", department_id).execute().data
        if not data:
            raise Exception("Department not found")
        return DepartmentResponse(**data[0])
    except Exception as e:
        print(f"Error fetching department: {e}")
        raise
    
def get_department_by_name(department_name: str) -> DepartmentResponse:
    """Get a department by name"""
    try:
        data = supabase.table("departments").select("*").eq("name", department_name).execute().data
        if not data:
            raise Exception("Department not found")
        return DepartmentResponse(**data[0])
    except Exception as e:
        logging.error(f"Error fetching department: {e}")
        raise

def get_all_departments() -> list[DepartmentResponse]:
    """Get all departments"""
    try:
        data = supabase.table("departments").select("id, name").execute().data
        return [DepartmentResponse(**item) for item in data]
    except Exception as e:
        logging.error(f"Error fetching departments: {e}")
        raise