import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Set up Supabase client
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)