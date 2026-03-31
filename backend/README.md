# LatentLab Research OS — Backend Setup

## Architecture

- backend/
  - `main.py` (FastAPI + Socket.IO app)
  - `config.py` (settings and env vars)
  - `db.py` (MongoDB client + collections)
  - `security.py` (bcrypt + JWT + Fernet encrypt/decrypt)
  - `utils.py` (helper functions)
  - `embeddings.py` (vector embedding API)
  - `chroma.py` (Chroma vector store wrapper)
  - `llm.py` (RAG helper and model requests)
  - `socket_events.py` (Socket.IO event handlers)
  - `routes/` (modular FastAPI routers)

- frontend/ (React + Vite + Socket.IO client)

---

## Backend Setup

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create `.env`

Copy `.env.example` or create `.env` with:

```ini
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET_KEY=your-strong-secret
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=1440
FERNET_KEY=your-fernet-key
CHROMA_BASE_DIR=./chroma_db

# Optional Gemini / OpenAI keys
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
```

- `JWT_SECRET_KEY`: must be secret
- `FERNET_KEY`: generate from `Fernet.generate_key().decode()`
- `MONGODB_URL`: local or Atlas URI

### 3. Start MongoDB

```bash
# Docker
docker run -d -p 27017:27017 --name mongo mongo:latest
```

Or start local MongoDB service.

### 4. Run backend

```bash
# In backend/ folder
python main.py

# Or manual uvicorn
uvicorn main:socket_app --host 127.0.0.1 --port 8000 --reload
```

---

## Frontend Quick Start

```bash
cd frontend
npm install
npm run dev
```

---

## How the Split Works

### JWT and auth
- `security.py`: password hashing, token creation/validation, token dependency
- `routes/auth.py`: `/register`, `/login` endpoints

### Chroma & embeddings
- `embeddings.py`: text to vector embedding
- `chroma.py`: open/restore index + upsert/search
- `routes/rag.py`: upload documents, query, context retrieval

### LLM & RAG
- `llm.py`: RAG prompt and response generation
- `socket_events.py`: handles live bot triggers in `@bot` messages

### Utilities
- `utils.py`: text chunking, ID generation, helper conversions

### Database
- `db.py`: Mongo client and tables `users`, `rooms`, `chat_history`, `uploads`

### Main app
- `main.py`: app startup, CORS, routers, Socket.IO ASGI wrapper

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /register | Register user |
| POST | /login | Login + receive JWT |
| GET | /users/me | Get current user |
| PUT | /users/me | Update profile |
| GET | /users/team | List users |
| GET | /rooms | List rooms |
| POST | /rooms | Create room |
| GET | /chat/history/{room} | Room chat history |
| POST | /rooms/{room}/upload | Upload docs for RAG |
| GET | /rooms/{room}/documents | List RAG docs |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join_research | client → server | join room |
| send_message | client → server | send message |
| chat_update | server → client | broadcast message |
| bot_typing | server → client | bot progress |

---

## Notes

- The project is already modularized into `utils`, ` llm`, `jwt/security`, `chroma`, and `routes`.
- Use `python -m py_compile backend/*.py backend/routes/*.py` to verify syntax.
- If you upgrade to production, use HTTPS and stronger key management.


