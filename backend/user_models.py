from pydantic import BaseModel, EmailStr
from uuid import UUID

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

    
class UserUpdateRequest(BaseModel):
    id: UUID
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
