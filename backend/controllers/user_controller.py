from services.user_service import get_all_graduates_count
from fastapi import APIRouter, HTTPException
from services.user_service import get_all_graduates, delete_user, update_graduate_basic, set_graduate_archived_status, get_graduate_details
from models.user_models import GraduateResponse, GraduateUpdateRequest


router = APIRouter(prefix="/graduates", tags=["Graduates"])

@router.get("/list", response_model=list[GraduateResponse])
async def list_graduates_endpoint():
    try:
        graduates = get_all_graduates()
        return graduates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
def get_all_graduates_count_endpoint():
    try:
        count = get_all_graduates_count()
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}", response_model=GraduateResponse)
async def get_graduate_endpoint(user_id: str):
    try:
        grad = get_graduate_details(user_id.strip())
        if grad is None:
            raise HTTPException(status_code=404, detail="Graduate not found")
        return grad
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{user_id}")
async def delete_graduate_endpoint(user_id: str):
    print(f"Received delete request for user_id: '{user_id}'")
    try:
        delete_user(user_id.strip())
        return {"status": "deleted", "id": user_id}
    except Exception as e:
        print(f"Delete endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
def get_all_graduates_count_endpoint():
       print("get_all_graduates_count_endpoint")
    
       print(get_all_graduates_count())   

@router.put("/{user_id}", response_model=GraduateResponse)
async def update_graduate_endpoint(user_id: str, request: GraduateUpdateRequest):
    try:
        updated = update_graduate_basic(user_id.strip(), request.model_dump())
        if updated is None:
            raise HTTPException(status_code=404, detail="Graduate not found")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{user_id}/archive")
async def archive_graduate_endpoint(user_id: str, archived: bool):
    try:
        set_graduate_archived_status(user_id.strip(), archived)
        return {"status": "success", "id": user_id, "archived": archived}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))