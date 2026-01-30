from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from jwt_utils import decode_token
from userdatabase import supabase

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
