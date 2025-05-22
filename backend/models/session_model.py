from pydantic import BaseModel

class SessionData(BaseModel):
    user_id: str  
    is_premium: bool
