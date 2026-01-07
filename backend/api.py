from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth_routes import router as auth_router
# 🔹 Import your core logic
from main import ask_grad_question

app = FastAPI(title="RAG Chatbot API", version="1.0.0")

# Enable CORS
# 🔥 ADD THIS LINE
app.include_router(auth_router)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Request/Response Models ==========
class QuestionRequest(BaseModel): question: str


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


@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Ask a question to the chatbot and return answer + evidence sources.
    """
    
    print("Received question:", request.question)
    try:
        result = ask_grad_question(request.question)

       

        return QuestionResponse(
            question=request.question,
            answer=result["answer"],
            sources=result["sources"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )
