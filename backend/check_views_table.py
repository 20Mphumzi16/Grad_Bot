import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

print("Checking 'user_document_views' table...")

try:
    # Try to select from the table
    res = supabase.table("user_document_views").select("*").limit(1).execute()
    print("Table exists. Data sample:", res.data)
except Exception as e:
    print(f"Error accessing table: {e}")
    if "relation" in str(e) and "does not exist" in str(e):
        print("Table 'user_document_views' does NOT exist.")
        
        # Try to create it via SQL if possible (usually needs SQL Editor, but let's try via a known RPC or just inform)
        print("Attempting to create table via raw SQL execution (this might fail if raw SQL is not enabled)...")
        # Usually we can't run raw SQL from the client unless there's a function for it.
        # But we can try to guide the user.
