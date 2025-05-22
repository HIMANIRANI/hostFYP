from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class Message(BaseModel):
    """Represents a user message."""
    email: EmailStr
    subject: str
    message: str
    created_at: datetime = datetime.utcnow()
    is_read: bool = False

class Feedback(BaseModel):
    """Represents user feedback."""
    email: EmailStr
    feedback_type: str  # e.g., "bug", "feature", "complaint", "praise"
    message: str
    created_at: datetime = datetime.utcnow()
    is_read: bool = False
    rating: Optional[int] = None  # Optional rating from 1-5 