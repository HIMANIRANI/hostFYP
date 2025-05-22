import logging
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from .auth_services import verify_token
from ..configurations.config import settings

# Set up logging
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def decodeJWT(token: str = Depends(oauth2_scheme)):
    logger.info("Attempting to decode JWT token")
    logger.info(f"Using SECRET_KEY: {settings.SECRET_KEY[:10]}...")  # Log first 10 chars of secret key
    
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Log the token format
        logger.info(f"Token format: {token[:20]}...")  # Log first 20 chars of token
        
        token_data = verify_token(token, credentials_exception)
        logger.info(f"Successfully decoded token for user: {token_data.username}")
        return {"sub": token_data.username}
    except Exception as e:
        logger.error(f"Failed to decode token: {str(e)}")
        logger.error(f"Token verification failed with error type: {type(e).__name__}")
        raise credentials_exception 