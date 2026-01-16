from fastapi import APIRouter, HTTPException
from userdatabase import get_all_graduates
from user_models import GraduateResponse

router = APIRouter(prefix="/graduates", tags=["Graduates"])

@router.get("/list", response_model=list[GraduateResponse])
async def list_graduates_endpoint():
    try:
        graduates = get_all_graduates()
        return graduates
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
