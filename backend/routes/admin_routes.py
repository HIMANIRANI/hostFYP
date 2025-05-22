from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
from backend.configurations.config import settings
from backend.services.admin_auth import get_current_admin
from pydantic import BaseModel
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])

# MongoDB connection
client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.userdata
users_collection = db["users"]

class UserResponse(BaseModel):
    email: str
    firstName: str
    lastName: str
    is_premium: bool = False
    message_count: int = 0
    last_message_date: datetime | None = None
    created_at: datetime | None = None

@router.get("/verify")
async def verify_admin_access(current_user: str = Depends(get_current_admin)):
    """Verify if the current user has admin access"""
    return {"status": "authorized", "email": current_user}

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: str = Depends(get_current_admin)):
    """Get all users with their premium status"""
    users = []
    async for user in users_collection.find({}, {"password": 0}):
        # Convert MongoDB _id to string
        user["_id"] = str(user["_id"])
        
        # Check if user has required fields, if not update the document
        needs_update = False
        update_data = {}
        
        if "is_premium" not in user:
            user["is_premium"] = False
            update_data["is_premium"] = False
            needs_update = True
            
        if "message_count" not in user:
            user["message_count"] = 0
            update_data["message_count"] = 0
            needs_update = True
            
        if "created_at" not in user:
            user["created_at"] = datetime.utcnow()
            update_data["created_at"] = datetime.utcnow()
            needs_update = True
            
        # Update the document if needed
        if needs_update:
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": update_data}
            )
            
        users.append(UserResponse(**user))
    return users

@router.get("/stats")
async def get_admin_stats(current_user: str = Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    total_users = await users_collection.count_documents({})
    premium_users = await users_collection.count_documents({"is_premium": True})
    non_premium_users = total_users - premium_users
    
    # Get users who joined in the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users = await users_collection.count_documents({
        "created_at": {"$gte": thirty_days_ago}
    })
    
    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "non_premium_users": non_premium_users,
        "new_users_last_30_days": new_users
    }

@router.put("/users/{email}/premium")
async def toggle_premium_status(
    email: str,
    make_premium: bool,
    current_user: str = Depends(get_current_admin)
):
    """Toggle premium status for a user"""
    result = await users_collection.update_one(
        {"email": email},
        {"$set": {"is_premium": make_premium}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": f"Premium status updated for {email}"} 

@router.post("/logout")
async def admin_logout():
    """Logout admin user"""
    return {"message": "Successfully logged out"} 