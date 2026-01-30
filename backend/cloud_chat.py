import os
import tempfile
import tiktoken
from datetime import datetime
from pypdf import PdfReader
from docx import Document
from pptx import Presentation
from supabase import create_client
from openai import OpenAI
from supabase.client import Client
from dotenv import load_dotenv
 
load_dotenv()
 
# Set up Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)
 
# Helps size text chunks based on token count
tokenizer = tiktoken.get_encoding("cl100k_base")
 
# Embedding parameters
CHUNCK_SIZE = 300
CHUNCK_OVERLAP = 70
RETRIEVAL_LIMIT = 3
 
# Set up OpenAI client and parameters
client = OpenAI()
 
NO_PREVIOUS_QS = 3
LIMIT_HISTORY = 2*NO_PREVIOUS_QS # Must be even
CONTEXT_TOKEN_BUDGET = 2500
PROMPT = (
        "You are a helpful assistant.\n"
        "Answer the user's question using ONLY the provided document context.\n"
        "If the answer is not present in the context, say you do not know.\n"
    )
 
TEST = False
 
## Train context
#/ Locally store and process the file to extract text
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
 
def extract_text(file_path: str) -> str:
 
    local_path = download_from_supabase(file_path)
 
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
 
#/ Embed and upload: Split, embed and store text into chunks based on token count
def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",  # 1536 dims
        input=text
    )
    return response.data[0].embedding
 
def chunk_text(text, chunk_size=CHUNCK_SIZE, overlap=CHUNCK_OVERLAP):
    tokens = tokenizer.encode(text)
    chunks = []
 
    i = 0
    while i < len(tokens):
        chunk = tokens[i:i + chunk_size]
        chunks.append(tokenizer.decode(chunk))
        i += chunk_size - overlap
 
    return chunks
 
def index_document(document_id: str, file_path: str):

    print("embedding doc: ",file_path)

    text = extract_text(file_path)
    chunks = chunk_text(text)
   
 
    # 1. Delete old chunks
    supabase.table("document_chunks") \
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
            "embedding": embed_text(chunk),
        })

    r = supabase.table("document_chunks").insert(rows).execute()
 
#/ Batch embedding
def embed_all():
    files = (
        supabase.table("documents")
        .select("*")
        .execute()
    ).data
 
    for file in files:
       
        file_path = file["file_path"]
        file_id = file["id"]
 
        index_document(file_id, file_path)
   
    return True
 
## Prompt
#/ Question
def question_history(chat_id):
 
    user_history_resp = (
        supabase.table("chat_messages")
        .select("content")
        .eq("chat_id", chat_id)
        .eq("role", "user")
        .order("id", desc=True)
        .limit(NO_PREVIOUS_QS)
        .execute()
    )
 
    previous_questions = [ r["content"] for r in user_history_resp.data]
 
    return previous_questions
 
def rewrite_query(previous_questions, current_question) -> str:
 
    if not previous_questions:
        return current_question
 
    history = "\n".join(previous_questions[::-1])
 
    prompt = f"""
        Rewrite the user's latest question into a standalone, explicit search query
        that can be used to retrieve relevant document passages.
 
        Conversation (user questions only):
        {history}
 
        Latest question:
        {current_question}
 
        Standalone search query:
        """.strip()
 
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )
 
    return response.choices[0].message.content.strip()
 
#/ Sources
def retrieve_chunks(query_embedding, limit=RETRIEVAL_LIMIT):
    response = supabase.rpc(
        "match_embeddings",
        {
            "query_embedding": query_embedding,
            "match_count": limit
        }
    ).execute()
 
    return response.data
 
def trim_chunks_by_tokens(chunks: list[dict]) -> list[dict]:
    total_tokens = 0
    sources = []
 
    for chunk in chunks:
 
        tokens = len(tokenizer.encode(chunk["content"]))
        if total_tokens + tokens > CONTEXT_TOKEN_BUDGET:
            break
 
        sources.append(format_citations(chunk))
 
        total_tokens += tokens
 
    return sources
 
def format_citations(chunk):
   
    page = chunk["page"]
    citation = {"chunk_id": chunk["chunk_id"], "text": chunk["content"], "source": chunk["file_name"], "page": f"{page}"}
 
    return citation

def chunks_by_id(chunks: list[str]) -> list[dict]:
 
    sources = []
 
    for chunk in chunks:
        response = supabase.rpc(
            "citations",
            {
                "p_chunk_id": chunk,
            }
        ).execute()
 
        source = response.data
 
        sources.append(format_citations(source))
 
    return sources

#/ Chat history
def ordered_history(user_id, limit=LIMIT_HISTORY):
 
    chat_id = get_chat_id(user_id)
   
    if not chat_id:
        chat_id = new_chat(user_id)
 
    chat_history_resp = (
        supabase.table("chat_messages")
        .select("*")
        .eq("chat_id", chat_id)
        .order("id", desc=True)
        .limit(limit)
        .execute()
    )
 
    chat_history = list(reversed(chat_history_resp.data))
 
    return chat_history
 
def context_history(chat_id, limit=LIMIT_HISTORY):
    chat_history_resp = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("chat_id", chat_id)
        .order("id")
        .limit(LIMIT_HISTORY)
        .execute()
    )
 
    chat_history = list(reversed(chat_history_resp.data))
 
    return chat_history
 
def messages(chat_history, context_text, question):
    messages = [{"role": "system", "content": PROMPT}]
 
    for msg in chat_history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
   
    messages.append({
        "role": "user",
        "content": f"""
        Context:
        {context_text}
 
        Question:
        {question}
        """.strip()
            })
   
    return messages

## Chat Handling
def get_chat_id(user_id):
    chat_id = (
        supabase.table("chats")
        .select("id")
        .eq("user_id", user_id)
        .execute()
        ).data
   
    if not chat_id: return None
        
    return chat_id[0]["id"]
 
def new_chat(user_id):
    chat_id = (
        supabase.table("chats")
        .insert({"user_id": user_id})
        .execute()
        ).data[0]["id"]
   
    return chat_id
 
def delete_chat(chat_id):
    response = (
        supabase.table("chats")
        .delete()
        .eq("id", chat_id)
        .execute()
        )
 
def new_chat_on_token(user_id):
    old_chat = get_chat_id(user_id)
    if old_chat:
        delete_chat(old_chat)
 
    chat_id = new_chat(user_id)
    return chat_id
 
def get_user_message_count(user_id):
    chat_id = get_chat_id(user_id)
    if not chat_id:
        return 0
    
    count = (
        supabase.table("chat_messages")
        .select("*", count="exact")
        .eq("chat_id", chat_id)
        .eq("role", "user")
        .execute()
    ).count
    
    return count if count else 0

## Chat function to answer questions based on document context
def chat(user_id, question):
    chat_existed = False
    local_time = datetime.now().strftime('%I:%M:%S %p')

    chat_id = get_chat_id(user_id)
    
    if not chat_id:
        chat_id = new_chat(user_id)
        previous_questions = []
    else:
        previous_questions = question_history(chat_id)
 
    ##QUESTIONS
    #/ improve question
    rewritten_question = rewrite_query(previous_questions, question)
 
    #/ store question
    question_tokens = len(tokenizer.encode(question))

    q = supabase.table("chat_messages").insert({
        "chat_id": chat_id,
        "role": "user",
        "content": question,
        "token_count": question_tokens,
        "time_stamp": local_time
    }).execute()
   
    if TEST: print("questions: ", q)
    #/ embed question
    query_embedding = embed_text(rewritten_question)
 
    ##SOURCES
    #/ get the best sources
    chunks = retrieve_chunks(query_embedding)
 
    sources = trim_chunks_by_tokens(chunks)
 
    #/ format context for the LLM
    context_text = ''
    for source in sources:
        file = source["source"]
        page = source["page"]
        content = source["text"]
        context_text = context_text + f"Source: {file}, Page:{page} \n {content} \n \n"
 
    #/ get chat history
    chat_history = context_history(chat_id)
 
    if TEST: print("\n context_text: ", context_text)
    if TEST: print("\n question: ", question)
    input = messages(chat_history, context_text, question)
 
    if TEST: print("input: ", input)
 
    ##Answer
    #/ get response
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=input
    )
    answer = completion.choices[0].message.content.strip()
 
    if TEST: print("answer: ",answer)
 
    #/ store answer
    answer_time = datetime.now().strftime('%I:%M:%S %p')
    answer_tokens = len(tokenizer.encode(answer))
    sources_id = [ s["chunk_id"] for s in sources]
 
    supabase.table("chat_messages").insert({
        "chat_id": chat_id,
        "role": "assistant",
        "content": answer,
        "time_stamp": local_time,
        "token_count": answer_tokens,
        "sources": sources_id
        }).execute()
 
    message = {"answer": answer, "question": question, "sources": sources, "chat_id": chat_id}
 
    return message
