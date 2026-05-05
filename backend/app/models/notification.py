
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class NotificationBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: str
    type: NotificationType = NotificationType.INFO
    competitor_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: str

class Notification(NotificationBase):
    id: Optional[str] = Field(alias="_id", default=None)
    user_id: str
    read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        extra = "ignore"
