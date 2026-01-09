from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DocumentCreate(BaseModel):
    file_name: str
    category_id: int
    description: Optional[str] = None


class DocumentResponse(BaseModel):
    id: UUID
    file_name: str
    category_id: int
    file_path: str
    file_extension: Optional[str]
    mime_type: str
    file_size: Optional[int]
    views: Optional[int]
    description: Optional[str]
    created_at: datetime
