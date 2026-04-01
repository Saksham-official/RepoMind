import os

# We gracefully handle missing imports to run without hitting errors when dependencies are not installed yet.
try:
    from supabase import create_client, Client
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def get_db_client(): # -> Client
    """
    Returns the Supabase PostgreSQL client. 
    Required for saving all AI actions, tracking installed repos, and storing webhooks.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠ WARNING: SUPABASE_URL or SUPABASE_KEY not set in environment. Skipping DB operations.")
        return None
        
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def log_ai_action(repo_id: str, target_number: int, event_type: str, reasoning: str):
    """Logs autonomous AI actions to the audit trail via Supabase."""
    client = get_db_client()
    if not client:
        return
    
    data = {
        "github_event_id": repo_id + "_" + str(target_number), # Temporary unique mapping
        "event_type": event_type,
        "target_type": "issue",
        "target_number": target_number,
        "reasoning": reasoning
    }
    
    try:
        # Pushes to the "ai_actions" table in Supabase PostgreSQL
        client.table("ai_actions").insert(data).execute()
        print(f"[DB] Successfully logged AI Action: {event_type} on issue {target_number}")
    except Exception as e:
        print(f"[DB] Error logging AI Action: {e}")
        
def save_repository(repo_id: str, repo_full_name: str, installation_id: int):
    """Upserts a repository tracked by Orbiter into the database."""
    client = get_db_client()
    if not client:
        return
    
    data = {
        "repo_id": str(repo_id),
        "full_name": repo_full_name,
        "installation_id": installation_id
    }
    
    try:
        client.table("repositories").upsert(data).execute()
        print(f"[DB] Repository upserted: {repo_full_name}")
    except Exception as e:
        print(f"[DB] Error saving repository: {e}")
