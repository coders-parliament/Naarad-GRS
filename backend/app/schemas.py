from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True

class GrievanceCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = "Other"
    name: Optional[str] = None
    email: Optional[str] = None

class GrievanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class GrievanceOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    name: Optional[str] = None
    email: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
