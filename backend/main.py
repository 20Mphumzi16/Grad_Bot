from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from controllers.auth_controller import router as auth_router
from controllers.graduate_skill_controller import router as graduate_skill_router
from controllers.skills_controller import router as skills_router
# 🔹 Import your core logic
from controllers.document_controller import router as document_router
from controllers.category_controller import router as category_router
from controllers.user_controller import router as user_router
from controllers.timeline_controller import router as timeline_router
from controllers.chat_controller import router as chat_router
from controllers.otp_controller import router as otp_router
import os
from dotenv import load_dotenv

app = FastAPI(title="RAG Chatbot API", version="1.0.0")
load_dotenv()

db_url = os.getenv("DATABASE_URL")
# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(os.getenv("FRONTEND_URL")), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable CORS
# 🔥 ADD THIS LINE
app.include_router(auth_router)
app.include_router(skills_router)
app.include_router(graduate_skill_router)
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
