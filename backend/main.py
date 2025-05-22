import base64
import json
import logging
import os
import sys
from pathlib import Path

import uvicorn
from fastapi import (Depends, FastAPI, HTTPException, Request, Response,
                     WebSocket, WebSocketDisconnect, status, Body)
from fastapi.concurrency import run_in_threadpool  # Added for threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

# Adjust path to import PredictionPipeline
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# from backend.models.model import PredictionPipeline
from backend.routes.auth_routes import router as auth_router
from backend.routes.payments import PaymentRequest, initiate_payment, router as payments_router
from backend.models.model_companydb_commented import PredictionPipeline
from backend.routes.profile_routes import router as profile_router
from backend.models.user_model import UserMessageLimit
from backend.services.jwt_handler import decodeJWT
from backend.routes.chat_routes import store_message, router as chat_router
from backend.configurations.config import settings
from backend.routes.session_routes import router as session_router
from backend.routes.protected_routes import router as protected_router
from backend.routes.admin_routes import router as admin_router
from backend.routes import auth_routes, admin_routes, contact_routes

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# FastAPI setup
app = FastAPI(
    title="NEPSE-Navigator",
    description="A system for finance",
    version="1.0.0",
)

# CORS setup
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register auth routes
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(profile_router)
app.include_router(payments_router)
app.include_router(session_router)
app.include_router(protected_router)
app.include_router(admin_router)
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(contact_routes.router)

# Model initialization
pipeline = PredictionPipeline()
try:
    logger.info("Loading PredictionPipeline components...")
    pipeline.load_model_and_tokenizers()
    pipeline.load_sentence_transformer()
    pipeline.load_reranking_model()
    pipeline.load_embeddings()
    logger.info("PredictionPipeline loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load PredictionPipeline: {str(e)}", exc_info=True)
    raise

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

class QueryRequest(BaseModel):
    question: str

# In-memory storage for user message limits (replace with database in production)
user_message_limits = {}

async def get_current_user(token: str = Depends(decodeJWT)) -> Optional[str]:
    if not token:
        return None
    return token.get("user_id")

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to the NEPSE-Navigator System!",
        "documentation_url": "/docs",
        "authentication_routes": "/auth",
        "payment_routes": "/api/initiate-payment"
    }

        
@app.post("/api/initiate-payment")
async def payment_endpoint(request: PaymentRequest):
    try:
        logger.info(f"Payment request: {request.dict()}")
        response = await initiate_payment(request)
        logger.info("Payment initiated.")
        return response
    except Exception as e:
        logger.error(f"Payment initiation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")

@app.get("/success")
async def handle_payment_success(request: Request):
    method = request.query_params.get("method")
    data = request.query_params.get("data")
    if not method or not data:
        logger.warning("Missing success parameters")
        raise HTTPException(status_code=400, detail="Missing method or data parameter")

    if method == "esewa":
        try:
            decoded_data = base64.b64decode(data).decode("utf-8")
            payment_data = json.loads(decoded_data)
            if payment_data.get("status") == "COMPLETE":
                return RedirectResponse(url=f"http://localhost:5173/success?method={method}&data={data}")
            raise HTTPException(status_code=400, detail="Payment not completed")
        except Exception as e:
            logger.error(f"Payment decode error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error processing payment: {str(e)}")
    raise HTTPException(status_code=400, detail="Invalid payment method")

@app.get("/failure")
async def handle_payment_failure():
    logger.info("Payment failed, redirecting...")
    return RedirectResponse(url="http://localhost:5173/failure")

# Add this new route for stock data
@app.get("/api/stocks/today")
async def get_today_stocks():
    try:
        # Construct the path to today.json
        json_path = Path("backend/data/initial data/date/today.json")
        
        # If the file doesn't exist at the relative path, try absolute path
        if not json_path.exists():
            json_path = Path(os.path.dirname(os.path.abspath(__file__))) / "data" / "initial data" / "date" / "today.json"
        
        if not json_path.exists():
            raise HTTPException(status_code=404, detail="Stock data file not found")
            
        # Read and parse the JSON file
        with open(json_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            return data
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error parsing stock data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

client = AsyncIOMotorClient(settings.MONGODB_URI)
db = client.userdata
users_collection = db["users"]

@app.post("/api/predict")
async def predict(
    payload: dict,
    current_user: dict = Depends(decodeJWT)
):
    user_email = current_user["sub"]
    if not user_email:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Fetch user from DB to get is_premium status
    user_doc = await users_collection.find_one({"email": user_email})
    is_premium = user_doc.get("is_premium", False) if user_doc else False
    user_limit = user_message_limits.get(
        user_email,
        UserMessageLimit(user_id=user_email, is_premium=is_premium)
    )
    user_limit.is_premium = is_premium  # Always update in case it changed

    # Check if user can send message
    if not user_limit.can_send_message():
        raise HTTPException(
            status_code=403,
            detail="Message limit reached. Please upgrade to premium for unlimited messages."
        )

    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Missing 'question' in request body")

    # Increment message count for non-premium users
    user_limit.increment_message_count()
    user_message_limits[user_email] = user_limit

    # Store user message
    await store_message(
        user_id=user_email,
        sender=user_email,
        receiver="assistant",
        role="user",
        content=question,
        message_limit=user_limit.message_count
    )

    async def generate():
        try:
            assistant_message = ""
            for output in pipeline.make_predictions(question):
                if isinstance(output, str):
                    if not output.startswith('data: '):
                        output = f"data: {output}"
                    if not output.endswith('\n\n'):
                        output = f"{output}\n\n"
                    # Accumulate assistant message for storage
                    if output.startswith('data: '):
                        content = output[6:].strip()
                        if content != "END":
                            assistant_message += content
                yield output
            # Store assistant message after response is complete
            if assistant_message:
                await store_message(
                    user_id=user_email,
                    sender="assistant",
                    receiver=user_email,
                    role="assistant",
                    content=assistant_message,
                    message_limit=user_limit.message_count
                )
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}", exc_info=True)
            yield f"data: Error: {str(e)}\n\n"
            yield "data: END\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

