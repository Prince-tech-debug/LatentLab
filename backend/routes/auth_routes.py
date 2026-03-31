from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from models import UserRegister, Token
from auth import hash_password, verify_password, create_access_token
from database import users_collection

router = APIRouter(tags=["Auth"])


@router.post("/register", status_code=201)
async def register(user: UserRegister):
    if await users_collection.find_one({"$or": [{"username": user.username}, {"email": user.email}]}):
        raise HTTPException(status_code=400, detail="Username or email already exists")
    doc = user.model_dump()
    doc["password"] = hash_password(doc["password"])
    doc.update({"age": None, "institution": None, "role": None, "bio": None,
                "created_at": datetime.now(timezone.utc)})
    await users_collection.insert_one(doc)
    return {"message": "Researcher profile created"}


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one(
        {"$or": [{"username": form_data.username}, {"email": form_data.username}]}
    )
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"access_token": create_access_token({"sub": user["username"]}), "token_type": "bearer"}
