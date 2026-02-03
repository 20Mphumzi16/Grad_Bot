import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Initialize Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

print("CATEGORY SERVICE LOADED FROM:", __file__)

def create_category(name: str, description: str | None = None):
    insert_data = {
        "name": name,
        "description": description
    }

    result = supabase.table("categories").insert(insert_data).execute()

    if not result.data:
        raise Exception("Failed to create category")

    return result.data[0]

def list_categories():
    result = supabase.table("categories").select("*").order("name", desc=False).execute()
    return result.data
