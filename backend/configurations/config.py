import os
from dotenv import load_dotenv
load_dotenv()


class Settings:
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://database:dbpassword@userdata.o9orl.mongodb.net/?retryWrites=true&w=majority")
    SECRET_KEY = os.getenv("ABAZJO123", "your_super_secret_key")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "886481282340-ua5r107135v0lc58kngkgsb0tvvb2kii.apps.googleusercontent.com")
    session_secret_key = os.getenv("SESSION_SECRET_KEY")
settings = Settings()
