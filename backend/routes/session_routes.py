
from fastapi import APIRouter, Depends, Response, HTTPException
from uuid import UUID, uuid4
from services.session import backend, cookie, verifier, SessionData
from motor.motor_asyncio import AsyncIOMotorClient
from ..configurations.config import settings

router = APIRouter()

# Initialize MongoDB client (or import your existing db connection)
client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.userdata
users_collection = db["users"]


@router.post("/login")
async def login(response: Response, email: str, password: str):
    # Lookup user in DB
    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify password (import your verify_password function or implement here)
    from ..services.auth_services import verify_password
    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create session
    session_id = uuid4()
    session_data = SessionData(user_id=str(user["_id"]), is_premium=user.get("is_premium", False))
    await backend.create(session_id, session_data)

    # Attach cookie
    cookie.attach_to_response(response, session_id)
    return {"message": "Logged in successfully"}


@router.post("/logout")
async def logout(session_id: UUID = Depends(cookie), response: Response = None):
    await backend.delete(session_id)
    cookie.delete_from_response(response)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(session_data: SessionData = Depends(verifier)):
    # Optionally return user info from session_data
    return {"user_id": session_data.user_id, "is_premium": session_data.is_premium}