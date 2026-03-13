import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_KEY in environment variables.\n"
        "1. Go to your Supabase project dashboard → Settings → API\n"
        "2. Copy the 'Project URL' and 'anon/public' key\n"
        "3. Add them to your .env file:\n"
        "   SUPABASE_URL=https://your-project.supabase.co\n"
        "   SUPABASE_KEY=your-anon-key"
    )

supabase: Client = create_client(url, key)

def get_supabase():
    return supabase
