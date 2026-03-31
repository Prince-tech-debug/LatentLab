from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    age: Optional[int] = None
    institution: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class RoomCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "indigo"


class RoomJoin(BaseModel):
    join_id: str
