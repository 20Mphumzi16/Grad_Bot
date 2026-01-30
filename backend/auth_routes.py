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
from dependencies import get_current_user, oauth2_scheme

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
            user_id=user["id"],
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
