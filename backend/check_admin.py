import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from backend.configurations.config import settings

async def check_admin_status(email: str):
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.userdata
    users_collection = db["users"]

    # Find the user
    user = await users_collection.find_one({"email": email})
    
    if user:
        print(f"\nUser found:")
        print(f"Email: {user.get('email')}")
        print(f"Name: {user.get('firstName')} {user.get('lastName')}")
        print(f"Is Admin: {user.get('is_admin', False)}")
        print(f"Is Premium: {user.get('is_premium', False)}")
    else:
        print(f"\nNo user found with email: {email}")

    # Close the connection
    client.close()

if __name__ == "__main__":
    email = input("Enter admin email to check: ")
    asyncio.run(check_admin_status(email)) 