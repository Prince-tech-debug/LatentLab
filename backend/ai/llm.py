import os
from config import GEMINI_API_KEY, CHROMA_BASE_DIR
from langchain_google_genai import ChatGoogleGenerativeAI

# LLM — initialized once at module load (fast, no network call)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=GEMINI_API_KEY,
    temperature=0.7,
)

# Embedding model — lazy loaded on first use
_embedding_model = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        print("📥 Loading embedding model (may take a moment)...")
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("✅ Embedding model loaded")
    return _embedding_model


def get_embedding(text: str) -> list:
    return _get_embedding_model().encode(text).tolist()


def get_vectorstore(room_name: str):
    from langchain_chroma import Chroma

    class LocalEmbeddings:
        def __call__(self, texts):
            return [get_embedding(t) for t in texts]
        def embed_query(self, text):
            return get_embedding(text)
        def embed_documents(self, texts):
            return [get_embedding(t) for t in texts]

    return Chroma(
        persist_directory=os.path.join(CHROMA_BASE_DIR, room_name),
        embedding_function=LocalEmbeddings(),
        collection_name=room_name.replace("-", "_"),
    )
