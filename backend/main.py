import socketio
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import db, rooms_collection, chat_collection
from auth import encrypt_text, decrypt_text
from ai.rag import get_rag_answer, is_group_leader, clear_room_chat_history, remove_document_from_room

from routes.auth_routes import router as auth_router
from routes.user_routes import router as user_router
from routes.room_routes import router as room_router
from routes.chat_routes import router as chat_router

# Creating a Socket server with ASGI mode and CORS settings
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    ping_timeout=60,
    ping_interval=25,
)

#Initializing FastAPI app and adding CORS middleware
app = FastAPI(title="LatentLab Research OS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(room_router)
app.include_router(chat_router)


@app.on_event("startup")
async def startup_db_client():
    try:
        await db.command("ping")
        print("✅ MongoDB connected successfully")
        await rooms_collection.create_index("join_id", unique=True, sparse=True)
        await chat_collection.create_index([("room", 1), ("timestamp", 1)])
        print("✅ Database indexes created")
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise


# ── Socket.IO helpers ──────────────────────────────────────────────────────────
async def _save_and_emit_bot(room: str, text: str):
    result = await chat_collection.insert_one({
        "username": "Latent",
        "text": encrypt_text(text),
        "room": room,
        "timestamp": datetime.now(timezone.utc),
        "is_bot": True,
    })
    await sio.emit("chat_update", {
        "id": str(result.inserted_id),
        "username": "Latent",
        "text": text,
        "time": datetime.now(timezone.utc).strftime("%H:%M"),
        "room": room,
        "is_bot": True,
    }, room=room)


# ── Socket.IO events ───────────────────────────────────────────────────────────
@sio.event
async def join_research(sid, data):
    room = data.get("room")
    username = data.get("username")
    await sio.enter_room(sid, room)
    print(f"✅ {username} joined room: {room}")


@sio.event
async def send_message(sid, data):
    room = data.get("room", "")
    text = data.get("text", "")
    username = data.get("username", "Anonymous")
    print(f"📨 Message from {username} in {room}: {text[:50]}")

    result = await chat_collection.insert_one({
        "username": username, "text": encrypt_text(text),
        "room": room, "timestamp": datetime.now(timezone.utc), "is_bot": False,
    })
    await sio.emit("chat_update", {
        "id": str(result.inserted_id),
        "username": username,
        "text": text,
        "room": room,
        "time": datetime.now(timezone.utc).strftime("%H:%M"),
        "is_bot": False,
    }, room=room)

    if not text.strip().lower().startswith("@latent"):
        return

    question = text.strip()[7:].strip()
    if not question:
        return

    cmd_lower = question.lower()
    is_leader = await is_group_leader(username, room)
    is_clear_intent = (
        any(w in cmd_lower for w in ["clear", "delete", "remove"]) and
        any(w in cmd_lower for w in ["history", "chat", "message", "all"])
    )
    is_remove_doc = "remove" in cmd_lower and "document" in cmd_lower

    # ── Admin: clear history ───────────────────────────────────────────────────
    if is_leader and is_clear_intent and not is_remove_doc:
        await sio.emit("bot_typing", {"room": room}, room=room)
        res = await clear_room_chat_history(room)
        await sio.emit("clear_history", {"room": room}, room=room)
        await _save_and_emit_bot(room, res["message"])
        return

    # ── Admin: remove document ─────────────────────────────────────────────────
    if is_leader and is_remove_doc:
        parts = question.split("remove document", 1)
        doc_name = parts[1].strip() if len(parts) > 1 else ""
        if not doc_name:
            await _save_and_emit_bot(room, "❌ Usage: @latent remove document filename.pdf")
            return
        await sio.emit("bot_typing", {"room": room}, room=room)
        res = await remove_document_from_room(room, doc_name)
        if res.get("success"):
            await sio.emit("document_removed", {"room": room, "document": doc_name}, room=room)
        await _save_and_emit_bot(room, res["message"])
        return

    # ── Non-leader tries admin command ─────────────────────────────────────────
    if not is_leader and (is_clear_intent or is_remove_doc):
        await _save_and_emit_bot(room, "❌ Only group leaders can use admin commands.")
        return

    # ── Regular RAG query ──────────────────────────────────────────────────────
    await sio.emit("bot_typing", {"room": room}, room=room)
    history = []
    async for msg in chat_collection.find({"room": room}).sort("timestamp", -1).limit(12):
        history.append({"username": msg["username"], "text": decrypt_text(msg["text"])})
    history.reverse()

    try:
        bot_text = await get_rag_answer(room, question, history)
        await _save_and_emit_bot(room, bot_text)
    except Exception as e:
        print(f"❌ Bot response failed: {e}")
        await _save_and_emit_bot(room, f"⚠️ Error: {str(e)[:100]}")


# ── Mount ──────────────────────────────────────────────────────────────────────
socket_app = socketio.ASGIApp(sio, app, socketio_path="socket.io")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting LatentLab backend...")
    uvicorn.run(socket_app, host="127.0.0.1", port=8000, log_level="info")
