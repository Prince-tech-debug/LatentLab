from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL

client = AsyncIOMotorClient(MONGODB_URL)
db = client.Latent_db

users_collection = db.users
chat_collection = db.chat_history
rooms_collection = db.rooms
