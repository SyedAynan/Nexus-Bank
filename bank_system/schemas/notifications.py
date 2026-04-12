from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from bank_system.models.db_models import NotificationType


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.info
    user_id: Optional[int] = None  # None means broadcast to all users


class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    is_read: bool = True
