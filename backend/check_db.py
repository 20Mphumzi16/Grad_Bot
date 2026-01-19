
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

print("Checking milestones...")
try:
    milestones = supabase.table("milestones").select("*").execute().data
    print(f"Milestones count: {len(milestones)}")
    print(milestones)
except Exception as e:
    print(f"Error fetching milestones: {e}")

print("\nChecking tasks...")
try:
    tasks = supabase.table("tasks").select("*").execute().data
    print(f"Tasks count: {len(tasks)}")
    print(tasks)
except Exception as e:
    print(f"Error fetching tasks: {e}")
