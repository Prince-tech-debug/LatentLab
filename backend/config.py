import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

SECRET_KEY = os.getenv("JWT_TOKEN")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

MONGODB_URL = os.getenv("MONGODB_URL")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FERNET_KEY = os.getenv("FERNET_KEY")

cipher_suite = Fernet(FERNET_KEY)
CHROMA_BASE_DIR = "./chroma_db"
os.makedirs(CHROMA_BASE_DIR, exist_ok=True)
