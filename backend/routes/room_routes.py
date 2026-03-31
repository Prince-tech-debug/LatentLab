from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from models import RoomCreate, RoomJoin
from auth import get_current_user, generate_join_id
from database import rooms_collection
from ai.llm import get_vectorstore

router = APIRouter(tags=["Rooms"])


@router.get("/rooms")
async def get_my_rooms(current_user: str = Depends(get_current_user)):
    rooms = []
    async for room in rooms_collection.find({"members.username": current_user}):
        room["_id"] = str(room["_id"])
        member = next((m for m in room.get("members", []) if m["username"] == current_user), None)
        room["my_role"] = member["role"] if member else "member"
        room["member_count"] = len(room.get("members", []))
        if room["my_role"] != "group_lead":
            room.pop("join_id", None)
        try:
            room["doc_count"] = get_vectorstore(room["name"])._collection.count()
        except Exception:
            room["doc_count"] = 0
        rooms.append(room)
    return rooms


@router.post("/rooms", status_code=201)
async def create_room(room: RoomCreate, current_user: str = Depends(get_current_user)):
    safe_name = room.name.strip().replace(" ", "-")
    if await rooms_collection.find_one({"name": safe_name}):
        raise HTTPException(status_code=400, detail="A room with this name already exists")

    for _ in range(10):
        join_id = generate_join_id()
        if not await rooms_collection.find_one({"join_id": join_id}):
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate join ID, please try again")

    doc = {
        "name": safe_name,
        "description": room.description,
        "color": room.color,
        "join_id": join_id,
        "created_by": current_user,
        "created_at": datetime.now(timezone.utc),
        "members": [{"username": current_user, "role": "group_lead", "joined_at": datetime.now(timezone.utc)}],
    }
    result = await rooms_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    doc["my_role"] = "group_lead"
    doc["member_count"] = 1
    doc["doc_count"] = 0
    return doc


@router.post("/rooms/join")
async def join_room(body: RoomJoin, current_user: str = Depends(get_current_user)):
    room = await rooms_collection.find_one({"join_id": body.join_id.strip()})
    if not room:
        raise HTTPException(status_code=404, detail="Invalid join ID — no room found")
    if any(m["username"] == current_user for m in room.get("members", [])):
        raise HTTPException(status_code=400, detail="You're already a member of this room")

    await rooms_collection.update_one(
        {"join_id": body.join_id.strip()},
        {"$push": {"members": {"username": current_user, "role": "member", "joined_at": datetime.now(timezone.utc)}}},
    )
    room["_id"] = str(room["_id"])
    room["my_role"] = "member"
    room["member_count"] = len(room.get("members", [])) + 1
    room.pop("join_id", None)
    try:
        room["doc_count"] = get_vectorstore(room["name"])._collection.count()
    except Exception:
        room["doc_count"] = 0
    return room


@router.get("/rooms/{room_name}/members")
async def get_room_members(room_name: str, current_user: str = Depends(get_current_user)):
    room = await rooms_collection.find_one({"name": room_name, "members.username": current_user})
    if not room:
        raise HTTPException(status_code=403, detail="Not a member of this room")
    return {"members": room.get("members", [])}
