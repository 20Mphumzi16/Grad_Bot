from pydantic import BaseModel

class BranchCreate(BaseModel):
    name: str

class BranchResponse(BaseModel):
    id: int
    name: str
    