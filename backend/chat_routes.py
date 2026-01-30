from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from cloud_chat import chat, ordered_history, get_user_message_count, chunks_by_id, new_chat_on_token

router = APIRouter(prefix="/chat", tags=["Chat"])

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

class SourcesRequest(BaseModel):
    chunks: list[str]


@router.post("/ask")
async def ask_question(request: QuestionRequest):
    """
    Ask a question to the chatbot and return answer + evidence sources.
    """
    
    print("Received question:", request.question)
    try:
        result = chat(request.user_id, request.question)

       

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )

@router.get("/get-history/{user_id}")
async def get_chat_history(user_id: str):
    return ordered_history(user_id, limit=100)

@router.get("/count/{user_id}")
async def get_message_count(user_id: str):
    try:
        count = get_user_message_count(user_id)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/get-chat-sources")
async def get_chat_sources(request: SourcesRequest):
    try:
        sources = chunks_by_id(request.chunks)
        return sources
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching sources: {str(e)}")

@router.post("/reset/{user_id}")
async def reset_chat(user_id: str):
    try:
        new_chat_id = new_chat_on_token(user_id)
        return {"message": "Chat reset successfully", "chat_id": new_chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting chat: {str(e)}")
