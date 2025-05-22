from fastapi import APIRouter, Depends
from services.session import verifier, SessionData

router = APIRouter()

@router.get("/protected")
async def protected_route(session_data: SessionData = Depends(verifier)):
    return {"message": f"Hello user {session_data.user_id}, premium? {session_data.is_premium}"}
