import email

from fastapi import APIRouter, HTTPException, Depends,UploadFile, File
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from user_models  import *
from user_models import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdateRequest,FirstLoginResponse
from typing import Union

from userdatabase import new_user, get_user, supabase, update_user
from jwt_utils import create_access_token, decode_token
from uuid import UUID

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = {}

    # Fetch User
    user_res = (
        supabase.table("User")
        .select("*")
        .eq("email", email)
        .execute()
    ).data
    
    if not user_res:
        raise HTTPException(status_code=401, detail="User not found")
    
    log_in = user_res[0]

    user["id"] = log_in["id"]
    user["email"] = log_in["email"]

    # Fetch Profile
    profile_res = (
        supabase.table("profile")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data
    
    if not profile_res:
         raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_res[0]

    # Fetch Contact
    contact_res = (
        supabase.table("contact")
        .select("*")
        .eq("id", user["id"])
        .execute()
    ).data
    
    contact = contact_res[0] if contact_res else {}
    
    user["avatar_url"] = profile.get("avatar_url")
    user["first_name"] = profile.get("first_name")
    user["last_name"] = profile.get("last_name")
    user["emp_no"] = profile.get("emp_no")
    user["role"] = profile.get("role")
    user["department"] = profile.get("department")
    user["branch"] = profile.get("branch")
    user["phone"] = contact.get("phone")

    if user.get("role", "").lower() == "graduate":
        grad_res = (
            supabase.table("graduates")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data
        
        if grad_res:
            grad = grad_res[0]
            user["start_date"] = grad.get("start_date")
            user["bio"] = grad.get("bio")
            user["linkedin_link"] = grad.get("linkedin_link")
            user["github_link"] = grad.get("github_link")

    else:
        admin_res = ( 
            supabase.table("admins")
            .select("*")
            .eq("id", user["id"])
            .execute()
        ).data
        
        if admin_res:
            admin = admin_res[0]
            user["position"] = admin.get("position")
    
    return user

router = APIRouter(prefix="/auth", tags=["Auth"])


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
@router.post(
    "/login",
    response_model=Union[TokenResponse, FirstLoginResponse]
)
async def login(request: LoginRequest):
    result = get_user(request.email, request.password)

    if result is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if isinstance(result, list) and result and result[0] is None:
        message = result[1] if len(result) > 1 else "Invalid email or password"
        raise HTTPException(status_code=401, detail=message)
    
    user = result

    flag = user.get("must_reset_password", False)
    should_reset = (
        (flag is True) or
        (isinstance(flag, int) and flag == 1) or
        (isinstance(flag, str) and flag.strip().lower() in ("true", "1", "t", "yes", "y"))
    )
    if should_reset:
        return FirstLoginResponse(
            status="FIRST_LOGIN_REQUIRED",
            email=user["email"],
    )

    token = create_access_token({
        "sub": user["email"],
        "role": user["role"],
        "user_id": user["id"]
    })

    return {"access_token": token}

@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id: UUID = current_user["id"]

    file_ext = file.filename.split(".")[-1]
    file_name = f"{user_id}.{file_ext}"
    file_path = f"avatars/{file_name}"

    contents = await file.read()

    # Optional: overwrite old avatar
    supabase.storage.from_("Profile_Pictures").upload(
        file_path,
        contents,
        {"content-type": file.content_type, "upsert": "true"},
    )

    # ❗ IMPORTANT: signed URLs are TEMPORARY — do NOT store them
    public_url = supabase.storage.from_("Profile_Pictures").get_public_url(file_path)

    supabase.table("profile").update(
        {"avatar_url": public_url}
    ).eq("id", user_id).execute()

    return {"avatar_url": public_url}

@router.delete("/delete-avatar")
async def remove_avatar(current_user: dict = Depends(get_current_user)):
    """
    Remove the current user's profile image:
    - delete file from Supabase storage
    - set profile.avatar_url to NULL
    """
    user_id: UUID = current_user["id"]

    # Get current avatar_url from profile
    profile_res = (
        supabase.table("profile")
        .select("avatar_url")
        .eq("id", user_id)
        .execute()
        .data
    )

    if not profile_res or not profile_res[0].get("avatar_url"):
        raise HTTPException(status_code=404, detail="No avatar to delete")

    avatar_url = profile_res[0]["avatar_url"]

    # Extract filename from URL and build storage path
    file_name = avatar_url.split("/")[-1]  # e.g. "<user_id>.png"
    file_path = f"avatars/{file_name}"

    # Delete from storage bucket
    supabase.storage.from_("Profile_Pictures").remove([file_path])

    # Set avatar_url to NULL in profile
    supabase.table("profile").update(
        {"avatar_url": None}
    ).eq("id", user_id).execute()

    return {"detail": "Avatar removed", "avatar_url": None}
