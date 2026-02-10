from services.category_service import list_categories, create_category
from fastapi import APIRouter, HTTPException
from models.category_models import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.post("/create", response_model=CategoryResponse)
async def create_category_endpoint(request: CategoryCreate):
    try:
        category = create_category(
            name=request.name,
            description=request.description
        )
        return category

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/list", response_model=list[CategoryResponse])
async def list_categories_endpoint():
    try:
        categories = list_categories()
        return categories

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))