import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

supabase: Client = None
if url and key and not url.startswith("your_"):
    try:
        supabase = create_client(url, key)
        # Attempt a lightweight check to verify the key
        # We don't care about the result, just want to see if it throws 401
        try:
            # Simple select to verify credentials
            supabase.table("study_materials").select("id").limit(1).execute()
        except Exception as auth_error:
            if "401" in str(auth_error) or "Invalid API key" in str(auth_error):
                print("Error: Supabase API Key is invalid (401 Unauthorized).")
                supabase = None # Reset so logic knows it's not usable
            else:
                # Other errors (e.g. table doesn't exist yet) are fine, 
                # they at least mean the key is valid enough to reach the DB
                pass
    except Exception as e:
        print(f"Warning: Could not initialize Supabase: {e}")
        supabase = None
else:
    print("Warning: Supabase credentials not configured. Proceeding without database.")

def get_supabase():
    return supabase
