import email

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from user_models  import *
from user_models import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdateRequest

from userdatabase import new_user, get_user, supabase, update_user
from jwt_utils import create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/register")
async def register(request: RegisterRequest):
    result = new_user(**request.model_dump())
    if result[0] is None:
        raise HTTPException(status_code=400, detail=result[1])

    user = result
    print("Registered user:", user)
    return user

@router.post("/update")
async def update(request: UserUpdateRequest):
    updated_user = update_user(request.model_dump())
    return updated_user

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    result = get_user(request.email, request.password)
    if result is None:
        raise HTTPException(status_code=401, detail=result[1])

    user = result
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
   
   
    user = {}
 
    log_in = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .execute()
    ).data[0]
 
    user["id"] = log_in["id"]
    user["email"] = log_in["email"]
 
    profile = (
        supabase.table("profile")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data[0]
 
    contact = (
        supabase.table("contact")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data[0]
   
    user["first_name"] = profile["first_name"]
    user["last_name"] = profile["last_name"]
    user["role"] = profile["role"]
    user["department"] = profile["department"]
    user["branch"] = profile["branch"]
    user["phone"] = contact["phone"]

 
    if user["role"].lower() == "graduate":
        print('hit 1')
 
        grad = (
            supabase.table("graduates")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data[0]
 
        user["start_date"] = grad["start_date"]
        user["bio"] = grad["bio"]
        user["linkedin_link"] = grad["linkedin_link"]
        user["github_link"] = grad["github_link"]
 
    else:
        admin = (
            supabase.table("admins")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data[0]
        user["position"] = admin["position"]
   
    print(user)
    return user
 
 

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

