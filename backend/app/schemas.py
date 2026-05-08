from pydantic import BaseModel

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
    name: str
    email: str
    category: str
    title: str
    description: str


class GrievanceOut(GrievanceCreate):
    id: int

    class Config:
        from_attributes = True
