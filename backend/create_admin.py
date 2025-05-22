import asyncio
import os
import sys
from pathlib import Path

# Add the project root directory to Python path
project_root = str(Path(__file__).parent.parent)
sys.path.insert(0, project_root)

from motor.motor_asyncio import AsyncIOMotorClient
from backend.configurations.config import settings
from backend.services.auth_services import hash_password
from datetime import datetime

async def create_admin_user(email: str, password: str, first_name: str, last_name: str):
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.userdata
    users_collection = db["users"]

    # Check if user already exists
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        print(f"User with email {email} already exists!")
        return

    # Hash the password using the same method as auth_services
    hashed_password = hash_password(password)

    # Create admin user document
    admin_user = {
        "email": email,
        "password": hashed_password,
        "firstName": first_name,
        "lastName": last_name,
        "is_admin": True,
        "is_premium": True,
        "message_count": 0,
        "created_at": datetime.utcnow()
    }

    # Insert the admin user
    result = await users_collection.insert_one(admin_user)
    
    if result.inserted_id:
        print(f"Admin user created successfully!")
        print(f"Email: {email}")
        print(f"Name: {first_name} {last_name}")
        print("\nYou can now login to the admin panel with these credentials.")
    else:
        print("Failed to create admin user.")

async def main():
    # Get admin user details
    print("Create Admin User")
    print("----------------")
    email = input("Enter admin email: ")
    password = input("Enter admin password: ")
    first_name = input("Enter first name: ")
    last_name = input("Enter last name: ")

    # Create the admin user
    await create_admin_user(email, password, first_name, last_name)

    # Close the MongoDB connection
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    client.close()

if __name__ == "__main__":
    asyncio.run(main()) 