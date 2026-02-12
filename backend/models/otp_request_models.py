from pydantic import BaseModel, EmailStr, validator
from uuid import UUID
import re

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmailVerifyRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 10:
            raise ValueError('Password must be at least 10 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if len(re.findall(r'\d', v)) < 2:
            raise ValueError('Password must contain at least two numbers')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v
