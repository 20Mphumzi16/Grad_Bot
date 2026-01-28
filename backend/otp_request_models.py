from pydantic import BaseModel, EmailStr
from uuid import UUID

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmailVerifyRequest(BaseModel):
    user_id: UUID
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    user_id: UUID
    otp: str


class ResetPasswordRequest(BaseModel):
    user_id: UUID
    new_password: str
