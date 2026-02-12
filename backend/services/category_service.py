from db.supabase_client import supabase


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
