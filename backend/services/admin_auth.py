import logging
from fastapi import Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from backend.configurations.config import settings
from backend.services.jwt_handler import decodeJWT
from typing import Optional

# Set up logging
logger = logging.getLogger(__name__)

# MongoDB connection
client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.userdata
users_collection = db["users"]

async def get_current_admin(token: str = Depends(decodeJWT)) -> str:
    """
    Middleware to verify if the current user is an admin.
    Returns the user's email if they are an admin, otherwise raises an HTTPException.
    """
    logger.info("Starting admin verification process")
    
    if not token:
        logger.error("No token provided in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user_email = token.get("sub")
    logger.info(f"Extracted email from token: {user_email}")
    
    if not user_email:
        logger.error("No email found in token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user = await users_collection.find_one({"email": user_email})
    logger.info(f"User found in database: {user is not None}")
    
    if not user:
        logger.error(f"User not found for email: {user_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    is_admin = user.get("is_admin", False)
    logger.info(f"User admin status: {is_admin}")
    
    if not is_admin:
        logger.error(f"User {user_email} is not an admin")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as admin"
        )
    
    logger.info(f"Admin verification successful for: {user_email}")
    return user_email

async def verify_admin_token(token: Optional[str] = None) -> bool:
    """
    Utility function to verify if a token belongs to an admin user.
    Returns True if the user is an admin, False otherwise.
    """
    if not token:
        return False
    
    try:
        decoded_token = await decodeJWT(token)
        if not decoded_token:
            return False
        
        user_email = decoded_token.get("sub")
        if not user_email:
            return False
        
        user = await users_collection.find_one({"email": user_email})
        return bool(user and user.get("is_admin", False))
    except:
        return False 