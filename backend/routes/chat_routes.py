import os
import shutil
import tempfile
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from auth import get_current_user, decrypt_text
from database import chat_collection, rooms_collection
from ai.llm import get_vectorstore, get_embedding

router = APIRouter(tags=["Chat"])


@router.get("/chat/history/{room}")
async def get_chat_history(room: str, current_user: str = Depends(get_current_user)):
    if not await rooms_collection.find_one({"name": room, "members.username": current_user}):
        raise HTTPException(status_code=403, detail="Not a member of this room")
    history = []
    async for msg in chat_collection.find({"room": room}).sort("timestamp", 1).limit(100):
        history.append({
            "id": str(msg["_id"]),
            "username": msg["username"],
            "text": decrypt_text(msg["text"]),
            "time": msg["timestamp"].strftime("%H:%M") if "timestamp" in msg else "00:00",
            "is_bot": msg.get("is_bot", False),
        })
    return history


def _split_chunks(text: str, chunk_size: int = 1000, overlap: int = 150) -> list:
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i: i + chunk_size]
        if chunk.strip():
            chunks.append(chunk)
    return chunks


@router.post("/rooms/{room_name}/upload", tags=["RAG"])
async def upload_document(room_name: str, file: UploadFile = File(...),
                           current_user: str = Depends(get_current_user)):
    if not await rooms_collection.find_one({"name": room_name, "members.username": current_user}):
        raise HTTPException(status_code=403, detail="Not a member of this room")

    ext_map = {
        "application/pdf": ".pdf",
        "text/plain": ".txt",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }
    suffix = ext_map.get(file.content_type)
    if not suffix:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, TXT, or DOCX.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        text = ""
        if suffix == ".pdf":
            from PyPDF2 import PdfReader
            reader = PdfReader(tmp_path)
            print(f"  📖 PDF has {len(reader.pages)} pages")
            text = "".join(page.extract_text() for page in reader.pages)
        elif suffix == ".docx":
            from docx import Document
            text = "\n".join(p.text for p in Document(tmp_path).paragraphs)
        else:
            with open(tmp_path, "r", encoding="utf-8") as f:
                text = f.read()

        chunks = _split_chunks(text)
        print(f"\n📄 '{file.filename}' → {len(text)} chars, {len(chunks)} chunks")

        if not chunks:
            return {"message": f"❌ No text extracted from '{file.filename}'.", "chunks": 0, "error": True}

        vs = get_vectorstore(room_name)
        for i, chunk in enumerate(chunks):
            vs._collection.add(
                embeddings=[get_embedding(chunk)],
                metadatas=[{"source_file": file.filename, "uploaded_by": current_user,
                             "room": room_name, "chunk_id": i}],
                documents=[chunk],
                ids=[f"{room_name}_{file.filename}_{i}"],
            )

        total = len(vs._collection.get().get('ids', []))
        print(f"✅ Upload complete! Added {len(chunks)} chunks. Total: {total}")
        return {"message": f"Indexed '{file.filename}' — {len(chunks)} chunks added.", "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        os.unlink(tmp_path)


@router.get("/rooms/{room_name}/documents", tags=["RAG"])
async def get_room_documents(room_name: str, current_user: str = Depends(get_current_user)):
    if not await rooms_collection.find_one({"name": room_name, "members.username": current_user}):
        raise HTTPException(status_code=403, detail="Not a member of this room")
    try:
        result = get_vectorstore(room_name)._collection.get()
        files = {}
        for meta in (result.get("metadatas") or []):
            if meta and "source_file" in meta:
                f = meta["source_file"]
                files[f] = files.get(f, 0) + 1
        return {"documents": [{"name": k, "chunks": v} for k, v in files.items()]}
    except Exception:
        return {"documents": []}
