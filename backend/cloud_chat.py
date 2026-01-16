import os
import tempfile
import tiktoken
from collections import defaultdict
from pypdf import PdfReader
from docx import Document
from pptx import Presentation
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv()

# Helps size text chunks based on token count
tokenizer = tiktoken.get_encoding("cl100k_base")

# Set up Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

# Set up OpenAI client and parameters
client = OpenAI()
SIMILARITY_THRESHOLD = -0.1

# Locally store and process the file to extract text
def extract_text(file_path: str) -> str:
    """
    Process different file types to extract text
    """

    def download_from_supabase(file_path: str) -> str:
        """
        Downloads a file from Supabase Storage and returns a local file path.
        """

        bucket = "Documents"

        file_name = os.path.basename(file_path)

        tmp_dir = tempfile.gettempdir()
        local_path = os.path.join(tmp_dir, file_name)

        res = supabase.storage.from_(bucket).download(file_path)

        with open(local_path, "wb") as f:
            f.write(res)

        return local_path

    local_path = download_from_supabase(file_path)
    print(local_path)

    if local_path.endswith(".pdf"):
        reader = PdfReader(local_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if local_path.endswith(".docx"):
        doc = Document(local_path)
        return "\n".join(p.text for p in doc.paragraphs)

    if local_path.endswith(".pptx"):
        prs = Presentation(local_path)
        text = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text.append(shape.text)
        return "\n".join(text)

    raise ValueError("Unsupported file type")

# Upload: Split, embed and store text into chunks based on token count
def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",  # 1536 dims
        input=text
    )
    return response.data[0].embedding

def chunk_text(text, chunk_size=1000, overlap=200):
    tokens = tokenizer.encode(text)
    chunks = []

    i = 0
    while i < len(tokens):
        chunk = tokens[i:i + chunk_size]
        chunks.append(tokenizer.decode(chunk))
        i += chunk_size - overlap

    return chunks

def embed_document(document_id: str, file_path: str):
    """
    Extracts text from the document, chunks it, embeds each chunk,
    """
    text = extract_text(file_path)
    chunks = chunk_text(text)

    # 1. Delete old chunks
    supabase.table("embeddings") \
        .delete() \
        .eq("document_id", document_id) \
        .execute()

    # 2. Insert fresh chunks
    rows = []
    for i, chunk in enumerate(chunks):
        rows.append({
            "document_id": document_id,
            "chunk_index": i,
            "content": chunk,
            "embedding": embed_text(chunk)
        })

    res = supabase.table("embeddings").insert(rows).execute()
    return res

# Answer: Retrieve and format relevant chunks for citation in chat response
def retrieve_chunks(query_embedding, limit=50):
    response = supabase.rpc(
        "match_embeddings",
        {
            "query_embedding": query_embedding,
            "match_count": limit
        }
    ).execute()

    for r in response.data:
        print(f"Document ID: {r['document_id']}, Similarity: {r['similarity']}")

    # Filter by similarity threshold
    filtered = [
        r for r in response.data
        if r["similarity"] >= SIMILARITY_THRESHOLD
    ]

    return filtered

def group_chunks_by_document(chunks, max_chunks_per_doc=3):
    grouped = defaultdict(list)

    # Group chunks
    for c in chunks:
        grouped[c["document_id"]].append(c)

    merged_docs = []

    for document_id, doc_chunks in grouped.items():
        # Sort by similarity (descending)
        doc_chunks.sort(key=lambda x: x["similarity"], reverse=True)

        # Keep top N chunks per document
        selected = doc_chunks[:max_chunks_per_doc]

        merged_docs.append({
            "document_id": document_id,
            "chunks": selected
        })

    return merged_docs

def format_grouped_context(grouped_docs):
    context_blocks = []

    for doc in grouped_docs:
        document_id = doc["document_id"]

        combined_text = "\n\n".join(
            chunk["content"] for chunk in doc["chunks"]
        )

        chunk_ids = ", ".join(
            f"chunk-{chunk['chunk_index']}" for chunk in doc["chunks"]
        )

        context_blocks.append(
            f"{combined_text}\n\nSource: [{document_id}#{chunk_ids}]"
        )

    return "\n\n---\n\n".join(context_blocks)

# Chat function to answer questions based on document context
def chat(question: str):
    query_embedding = embed_text(question)

    # Retrieve + filter
    chunks = retrieve_chunks(query_embedding)

    if not chunks:
        return "I couldn't find relevant information in the documents."

    # Deduplicate & merge
    grouped_docs = group_chunks_by_document(chunks)

    # Format context
    context = format_grouped_context(grouped_docs)

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Answer ONLY using the provided context. "
                    "Cite sources inline using the format [document#chunk]. "
                    "If the answer is not in the context, say you do not know."
                )
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion:\n{question}"
            }
        ]
    )

    return completion.choices[0].message.content

def embed_all_documents():
    documents = supabase.table("documents").select("*").execute().data

    for doc in documents:
        document_id = doc["id"]
        file_path = doc["file_path"]

        print(f"Embedding document {document_id}...")

        embed_document(document_id, file_path)
    return True

def test():
    result = supabase.table("documents").select("*").execute().data[4]
    print(result)
    file_path = result["file_path"]
    document_id = result["id"]

    res = embed_document(document_id, file_path)

    # file = extract_text(file_path)
    # print(file)
    # chunck = chunk_text(file)
    # print(chunck)

chat = chat("IBM turbonomics?")
print(chat)