import bcrypt
import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, cipher_suite

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def encrypt_text(text: str) -> str:
    return cipher_suite.encrypt(text.encode()).decode()


def decrypt_text(enc: str) -> str:
    try:
        return cipher_suite.decrypt(enc.encode()).decode()
    except Exception:
        return "[Decryption Error]"


def generate_join_id() -> str:
    d1 = ''.join(random.choices(string.digits, k=3))
    d2 = ''.join(random.choices(string.digits, k=3))
    l  = ''.join(random.choices(string.ascii_lowercase, k=3))
    return f"{d1}-{d2}-{l}"


async def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
