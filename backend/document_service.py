import os
import uuid
from fastapi import UploadFile
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def upload_document(
    file: UploadFile,
    file_name: str,
    category_id: int,
    description: str | None = None
) -> dict:

    document_id = str(uuid.uuid4())

    file_ext = file.filename.split(".")[-1].lower()
    mime_type = file.content_type

    # ✅ Read file into bytes
    file_bytes = file.file.read()
    file_size = len(file_bytes)

    # Reset pointer (good practice)
    file.file.seek(0)

    file_path = f"documents/{document_id}.{file_ext}"

    # 1️⃣ Upload to Supabase Storage
    supabase.storage.from_("Documents").upload(
        path=file_path,
        file=file_bytes,
        file_options={"content-type": mime_type}
    )

    # 2️⃣ Insert metadata
    insert_data = {
        "id": document_id,
        "file_name": file_name,
        "category_id": category_id,
        "file_path": file_path,
        "file_extension": file_ext,
        "mime_type": mime_type,
        "file_size": file_size,
        "views": 0,
        "description": description
    }

    result = supabase.table("documents").insert(insert_data).execute()

    if not result.data:
        raise Exception("Failed to insert document metadata")

    return result.data[0]


def get_document(document_id: str) -> dict | None:
    """
    Retrieve a document record from the database by its ID.

    Args:
        document_id: UUID of the document

    Returns:
        dict | None: Document record if found
    """
    result = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    if result.data:
        return result.data
    return None


def list_documents(category_id: int | None = None) -> list[dict]:
    """
    List all documents, optionally filtered by category.

    Args:
        category_id: Optional category to filter by

    Returns:
        list[dict]: List of document records
    """
    query = supabase.table("documents").select("*")
    if category_id is not None:
        query = query.eq("category_id", category_id)
    query = query.order("created_at", desc=True)
    result = query.execute()
    return result.data or []


def generate_signed_url(file_path: str, expires: int = 60) -> str:
    """
    Generate a signed URL for secure file download.

    Args:
        file_path: Path of the file in Supabase Storage
        expires: Expiration time in seconds

    Returns:
        str: Signed URL
    """
    signed = supabase.storage.from_("documents").create_signed_url(file_path, expires)
    return signed["signedURL"]

def delete_document(document_id: str) -> bool:
    """
    Delete a document from storage and database.

    Args:
        document_id: UUID of the document

    Returns:
        bool: True if deleted successfully
    """

    # 1️⃣ Get document to retrieve file path
    document = (
        supabase.table("documents")
        .select("file_path")
        .eq("id", document_id)
        .execute()
    ).data

    if not document:
        return False

    file_path = document[0]["file_path"]

    # 2️⃣ Delete file from Supabase Storage
    supabase.storage.from_("Documents").remove([file_path])

    # 3️⃣ Delete document record
    result = (
        supabase.table("documents")
        .delete()
        .eq("id", document_id)
        .execute()
    ).data

    return bool(result)
