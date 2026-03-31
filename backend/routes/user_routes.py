from fastapi import APIRouter, HTTPException, Depends
from models import UserProfileUpdate
from auth import get_current_user
from database import users_collection

router = APIRouter(tags=["Profile"])


@router.get("/users/me")
async def get_my_profile(current_user: str = Depends(get_current_user)):
    user = await users_collection.find_one({"username": current_user}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404)
    user["_id"] = str(user["_id"])
    return user


@router.put("/users/me")
async def update_profile(profile: UserProfileUpdate, current_user: str = Depends(get_current_user)):
    update = {k: v for k, v in profile.model_dump().items() if v is not None}
    if update:
        await users_collection.update_one({"username": current_user}, {"$set": update})
    return {"message": "Profile updated"}


@router.get("/users/team", tags=["Team"])
async def get_team(current_user: str = Depends(get_current_user)):
    team = []
    async for user in users_collection.find({}, {"password": 0}):
        user["_id"] = str(user["_id"])
        team.append(user)
    return team
