"""
File: notifications.py
Module: bank_system.api.routes.notifications

Purpose:
    In-app notification system API routes. Supports:
    - User: list, view, mark-read (own notifications only)
    - Admin: create notifications (single user or broadcast to all)
    - Admin: delete notifications

Developer Journey:
    - v1: No notification system — users had no way to receive alerts
      about fraud detections, successful transfers, or system announcements.
    - v2: Created notification model and CRUD routes. Users can view and
      mark-read their own notifications. Admins can create and delete.
    - v3: Added broadcast feature — admins can send announcements to all
      active users by setting user_id=null in the create request.

Security:
    - Users can only view/mark-read their OWN notifications (owner check)
    - Only admins can create or delete notifications (role_required)
    - Unread count endpoint enables the notification bell badge in the navbar
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from bank_system.api.deps import get_current_active_user, role_required
from bank_system.core.db import get_db
from bank_system.models.db_models import Notification, User, UserRole
from bank_system.schemas.notifications import NotificationCreate, NotificationRead

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/count")
def get_unread_count(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get unread notification count for the current user."""
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .count()
    )
    return {"unread_count": unread_count}


@router.get("/", response_model=list[NotificationRead])
def list_notifications(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
    unread_only: bool = Query(False, description="Filter to unread notifications only"),
):
    """List notifications for the current user."""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read.is_(False))

    notifications = query.order_by(Notification.created_at.desc()).all()
    return notifications


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get a single notification. Only the owner can view."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this notification")

    return notification


@router.post("/", response_model=NotificationRead, status_code=201)
def create_notification(
    payload: NotificationCreate,
    admin_user: Annotated[User, Depends(role_required(UserRole.admin))],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a notification (admin only). If user_id is None, broadcast to all users."""
    if payload.user_id is not None:
        # Single user notification
        target_user = db.query(User).filter(User.id == payload.user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        notification = Notification(
            user_id=payload.user_id,
            title=payload.title,
            message=payload.message,
            type=payload.type,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    # Broadcast to all active users
    users = db.query(User).filter(User.is_active.is_(True)).all()
    last_notification = None

    for user in users:
        notification = Notification(
            user_id=user.id,
            title=payload.title,
            message=payload.message,
            type=payload.type,
        )
        db.add(notification)
        last_notification = notification

    db.commit()

    if last_notification:
        db.refresh(last_notification)
        return last_notification

    raise HTTPException(status_code=400, detail="No active users to notify")


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Mark a notification as read. Only the owner can mark."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this notification")

    notification.is_read = True
    db.commit()
    return {"success": True}


@router.patch("/read-all")
def mark_all_as_read(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Mark all notifications as read for the current user."""
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .update({Notification.is_read: True})
    )
    db.commit()
    return {"success": True, "updated_count": updated_count}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    admin_user: Annotated[User, Depends(role_required(UserRole.admin))],
    db: Annotated[Session, Depends(get_db)],
):
    """Delete a notification (admin only)."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()
    return {"success": True}
