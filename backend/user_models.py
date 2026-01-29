from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Literal

class FirstLoginResponse(BaseModel):
    status: Literal["FIRST_LOGIN_REQUIRED"]
    user_id: UUID
    email: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str
    phone: str | None = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    emp_no: int | None = None
    avatar_url: str | None = None
    email: EmailStr
    role: str
    first_name: str
    last_name: str
    phone: str | None
    department: str | None
    branch: str | None
    start_date: str | None
    bio: str | None
    linkedin_link: str | None
    github_link: str | None
    position: str | None = None

class GraduateResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    role: str
    email: str
    phone: str | None
    progress: int | None = None
    archived: bool = False


class GraduateUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    role: str
    email: EmailStr
    phone: str | None = None
    progress: int | None = None

    
class UserUpdateRequest(BaseModel):
    id: UUID
    email: EmailStr
    emp_no: int | None = None
    avatar_url: str | None = None
    role: str
    first_name: str
    last_name: str
    phone: str | None
    department: str | None
    branch: str | None
    start_date: str | None
    bio: str | None
    linkedin_link: str | None
    github_link: str | None
    position: str | None = None
