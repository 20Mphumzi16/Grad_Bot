from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from user_models  import *
# from user_models import RegisterRequest, LoginRequest, TokenResponse, UserResponse

from userdatabase import new_user, get_user, supabase
from jwt_utils import create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    result = new_user(**request.model_dump())
    if result[0] is None:
        raise HTTPException(status_code=400, detail=result[1])

    user = result[0]
    return user

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    result = get_user(request.email, request.password)
    if result[0] is None:
        raise HTTPException(status_code=401, detail=result[1])

    user = result[0]
    token = create_access_token({
        "sub": user["email"],
        "role": user["role"],
        "user_id": user["id"]
    })

    return {"access_token": token}

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .execute()
    ).data

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user[0]

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
