from fastapi import APIRouter, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
from backend.configurations.config import settings
from backend.models.message_model import Message, Feedback
from datetime import datetime

router = APIRouter(prefix="/contact", tags=["Contact"])

# MongoDB connection
client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.userdata
messages_collection = db["messages"]
feedback_collection = db["feedback"]

@router.post("/message")
async def create_message(message: Message):
    """Create a new message from a user"""
    message_dict = message.dict()
    result = await messages_collection.insert_one(message_dict)
    if result.inserted_id:
        return {"message": "Message sent successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to send message"
    )

@router.post("/feedback")
async def create_feedback(feedback: Feedback):
    """Create new feedback from a user"""
    feedback_dict = feedback.dict()
    result = await feedback_collection.insert_one(feedback_dict)
    if result.inserted_id:
        return {"message": "Feedback submitted successfully"}
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to submit feedback"
    )

@router.get("/admin/messages", response_model=List[Message])
async def get_all_messages():
    """Get all messages (admin only)"""
    messages = []
    async for message in messages_collection.find().sort("created_at", -1):
        message["_id"] = str(message["_id"])
        messages.append(Message(**message))
    return messages

@router.get("/admin/feedback", response_model=List[Feedback])
async def get_all_feedback():
    """Get all feedback (admin only)"""
    feedback_list = []
    async for feedback in feedback_collection.find().sort("created_at", -1):
        feedback["_id"] = str(feedback["_id"])
        feedback_list.append(Feedback(**feedback))
    return feedback_list

@router.put("/admin/messages/{message_id}/read")
async def mark_message_read(message_id: str):
    """Mark a message as read (admin only)"""
    result = await messages_collection.update_one(
        {"_id": message_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    return {"message": "Message marked as read"}

@router.put("/admin/feedback/{feedback_id}/read")
async def mark_feedback_read(feedback_id: str):
    """Mark feedback as read (admin only)"""
    result = await feedback_collection.update_one(
        {"_id": feedback_id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    return {"message": "Feedback marked as read"}

@router.get("/message/count")
async def get_message_count():
    """Get total number of messages"""
    count = await messages_collection.count_documents({})
    return {"count": count}

@router.get("/feedback/count")
async def get_feedback_count():
    """Get total number of feedback entries"""
    count = await feedback_collection.count_documents({})
    return {"count": count} 