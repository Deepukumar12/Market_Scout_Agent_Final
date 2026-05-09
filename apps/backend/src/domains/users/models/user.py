from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None


class UserCreate(UserBase):
    # Enforce a basic password policy at the API boundary
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    role: str = "user"
    subscription_plan: str = "Free" # Free, Pro, Enterprise
    is_active: bool = True
    preferences: Dict[str, Any] = Field(default_factory=dict)


class User(UserBase):
    id: str = Field(alias="_id")
    is_active: bool = True
    role: str = "user"
    subscription_plan: str = "Free"
    created_at: datetime
    last_login: Optional[datetime] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        extra="ignore",
        json_encoders={datetime: lambda v: v.isoformat() if v else None}
    )


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class ActivityLog(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    action: str
    target: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

