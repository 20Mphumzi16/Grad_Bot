from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth_routes import router as auth_router
# 🔹 Import your core logic
from document_routes import router as document_router
from category_routes import router as category_router
from user_routes import router as user_router
from timeline_routes import router as timeline_router
from chat_routes import router as chat_router
from otp_routes import router as otp_router


app = FastAPI(title="RAG Chatbot API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable CORS
# 🔥 ADD THIS LINE
app.include_router(auth_router)
app.include_router(document_router)
app.include_router(category_router)
app.include_router(user_router)
app.include_router(timeline_router)
app.include_router(chat_router)
app.include_router(otp_router)


# ========== Request/Response Models ==========
class QuestionRequest(BaseModel): 
    user_id: str
    question: str


class Source(BaseModel):
    chunk_id: str
    text: str
    source: str
    page: str | None = None


class QuestionResponse(BaseModel):
    question: str
    answer: str
    sources: list[Source]



# ========== API Endpoints ==========
@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running", "status": "ready"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
