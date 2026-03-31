import time
import traceback
from datetime import datetime, timezone
from langchain_core.messages import HumanMessage
from ai.llm import llm, get_vectorstore, get_embedding
from database import chat_collection, rooms_collection
from auth import encrypt_text, decrypt_text


async def is_group_leader(username: str, room_name: str) -> bool:
    room = await rooms_collection.find_one({"name": room_name})
    if not room:
        return False
    return any(
        m["username"] == username and m["role"] == "group_lead"
        for m in room.get("members", [])
    )


async def clear_room_chat_history(room_name: str) -> dict:
    try:
        result = await chat_collection.delete_many({"room": room_name})
        return {"success": True, "message": f"✅ Cleared {result.deleted_count} messages from chat history"}
    except Exception as e:
        return {"success": False, "message": f"❌ Failed to clear history: {str(e)}"}


async def remove_document_from_room(room_name: str, filename: str) -> dict:
    try:
        print(f"\n🔍 Removing '{filename}' from room '{room_name}'")
        vs = get_vectorstore(room_name)
        result_before = vs._collection.get()
        total_before = len(result_before.get('ids', []))

        ids_to_delete = []
        stored_files = set()
        for i, meta in enumerate(result_before.get("metadatas", []) or []):
            if meta and meta.get("source_file"):
                stored_files.add(meta["source_file"])
            if meta and meta.get("source_file", "").lower() == filename.lower():
                ids_to_delete.append(result_before["ids"][i])

        if ids_to_delete:
            vs._collection.delete(ids=ids_to_delete)
            total_after = len(vs._collection.get().get('ids', []))
            removed = total_before - total_after
            if removed > 0:
                return {"success": True, "message": f"✅ Removed '{filename}' ({removed} chunks deleted)"}

        available = ", ".join(sorted(stored_files)) if stored_files else "None"
        return {"success": False, "message": f"❌ Document '{filename}' not found. Available: {available}"}
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "message": f"❌ Failed to remove document: {str(e)}"}


async def get_rag_answer(room_name: str, question: str, history: list) -> str:
    start = time.time()
    vs = get_vectorstore(room_name)
    history_ctx = "\n".join(f"{m['username']}: {m['text']}" for m in history[-8:])

    if vs._collection.count() == 0:
        prompt = (
            "You are Latent who is researching with other users. Answer concisely in 2-3 sentences "
            "but if the topic is too large you can answer in about max 3 paragraphs. "
            "Format your response using markdown with proper formatting.\n"
            f"Recent chat:\n{history_ctx}\n\nQ: {question}"
        )
    else:
        search_results = vs.similarity_search(question, k=2)
        print(f"⏱️ Vector search took {time.time() - start:.2f}s")
        context = "\n".join([doc.page_content[:300] for doc in search_results])
        prompt = (
            "You are a friendly researcher helping with research. Read the chat and provided documents "
            "and answer helpfully. Format your response using markdown. Don't make up information — "
            "if you used another source, mention it. You can ask follow-up questions occasionally.\n"
            f"Recent chat:\n{history_ctx}\n\nDocs:\n{context}\n\nQ: {question}"
        )

    print(f"📤 Starting API call at {time.time() - start:.2f}s")
    response = llm.invoke([HumanMessage(content=prompt)])
    print(f"✅ Got response in {time.time() - start:.2f}s")
    return response.content if hasattr(response, 'content') else str(response)
