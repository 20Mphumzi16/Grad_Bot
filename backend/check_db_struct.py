
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

print("Checking tasks structure...")
try:
    tasks = supabase.table("tasks").select("*").limit(1).execute().data
    if tasks:
        print("Task keys:", tasks[0].keys())
    else:
        print("No tasks found.")
except Exception as e:
    print(f"Error fetching tasks: {e}")
