from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from document_service import delete_document, upload_document
from document_models import DocumentResponse
from uuid import UUID
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)


router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/create", response_model=DocumentResponse)
async def create_document(
    file: UploadFile = File(...),
    file_name: str = Form(...),
    category_id: int = Form(...),
    description: str | None = Form(None)
):
    try:
        document = upload_document(
            file=file,
            file_name=file_name,
            category_id=category_id,
            description=description
        )
        return document

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-documents", response_model=list[DocumentResponse])
def list_documents():
    result = supabase.table("documents") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return result.data

@router.get("/{document_id}/download")
def download_document(document_id: UUID):
    doc = supabase.table("documents") \
        .select("file_path") \
        .eq("id", str(document_id)) \
        .single() \
        .execute()

    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    signed_url = supabase.storage.from_("Documents") \
        .create_signed_url(doc.data["file_path"], 60)

    return {"url": signed_url["signedURL"]}

@router.get("/{document_id}/view")
def download_document(document_id: UUID):
    doc = supabase.table("documents") \
        .select("file_path") \
        .eq("id", str(document_id)) \
        .single() \
        .execute()

    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    signed_url = supabase.storage.from_("Documents") \
        .create_signed_url(doc.data["file_path"], 60)
    
    increment_views(document_id)

    return {"url": signed_url["signedURL"]}

def increment_views(document_id: UUID):
    # Read current views value
    doc = supabase.table("documents") \
        .select("views") \
        .eq("id", str(document_id)) \
        .single() \
        .execute()

    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    current_views = doc.data.get("views") or 0
    new_views = current_views + 1

    # Update document with incremented views
    resp = supabase.table("documents") \
        .update({"views": new_views}) \
        .eq("id", str(document_id)) \
        .execute()

    if getattr(resp, "error", None):
        raise HTTPException(status_code=500, detail=str(resp.error))

    return {"status": "ok", "views": new_views}

@router.delete("/delete/{document_id}")
def remove_document(document_id: str):
    success = delete_document(document_id)

    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"message": "Document deleted successfully"}

@router.get("/get-newest-documents", response_model=list[DocumentResponse])
def list_documents():
    result = supabase.table("documents") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    return result.data

@router.get("/get-popular-documents", response_model=list[DocumentResponse])
def list_documents():
    result = supabase.table("documents") \
        .select("*") \
        .order("views", desc=True) \
        .limit(4) \
        .execute()

    return result.data
