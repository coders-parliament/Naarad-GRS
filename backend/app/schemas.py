from pydantic import BaseModel
from typing import Optional, List
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
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    preferred_language: Optional[str] = "English"

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    preferred_language: Optional[str] = None

class GrievanceCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = "Other"
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    attachment_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class GrievanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    attachment_url: Optional[str] = None
    remarks: Optional[str] = None

class GrievanceTimelineOut(BaseModel):
    id: int
    grievance_id: int
    status: str
    remarks: Optional[str] = None
    action_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GrievanceOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    user_id: Optional[int] = None
    attachment_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    reopened_count: int = 0
    escalation_level: int = 1
    citizen_count: int = 1
    created_at: datetime
    timeline: List[GrievanceTimelineOut] = []

    class Config:
        from_attributes = True

class DuplicateDetectRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DuplicateMatchOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    distance_meters: Optional[float] = None
    similarity: float
    citizen_count: int = 1

class SubscriptionCreate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class GrievanceFeedback(BaseModel):
    rating: int
    feedback: Optional[str] = None

class GrievanceReopen(BaseModel):
    remarks: str


