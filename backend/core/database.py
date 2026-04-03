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

def log_ai_action(github_repo_id: str, target_number: int, event_type: str, reasoning: str):
    """Logs autonomous AI actions to the audit trail via Supabase."""
    client = get_db_client()
    if not client:
        return
        
    try:
        # First lookup the internal UUID for the repository using the github_repo_id
        repo_response = client.table("repositories").select("id").eq("github_repo_id", int(github_repo_id)).execute()
        
        if not repo_response.data:
            print(f"[DB] Cannot log AI Action. Repository with GitHub ID {github_repo_id} not indexed in Supabase.")
            return

        internal_repo_uuid = repo_response.data[0]["id"]
        
        data = {
            "github_event_id": str(github_repo_id) + "_" + str(target_number),
            "event_type": event_type,
            "target_type": "issue",
            "target_number": target_number,
            "reasoning": reasoning,
            "repo_id": internal_repo_uuid
        }
        
        # Pushes to the "ai_actions" table in Supabase PostgreSQL
        client.table("ai_actions").insert(data).execute()
        print(f"[DB] Successfully logged AI Action: {event_type} on issue {target_number}")
    except Exception as e:
        print(f"[DB] Error logging AI Action: {e}")
        
def save_repository(github_repo_id: str, repo_full_name: str, installation_id: int):
    """Upserts a repository tracked by Orbiter into the database."""
    client = get_db_client()
    if not client:
        return
    
    # Split repo-name/owner
    owner = "unknown"
    repo_name = repo_full_name
    if "/" in repo_full_name:
        owner, repo_name = repo_full_name.split("/", 1)

    data = {
        "github_repo_id": int(github_repo_id),
        "owner": owner,
        "repo_name": repo_name,
        "installation_id": installation_id,
        "is_indexed": True # Mark as indexed immediately in dev
    }
    
    try:
        # Use github_repo_id as the filter for upsert
        client.table("repositories").upsert(data, on_conflict="github_repo_id").execute()
        print(f"[DB] Repository upserted: {repo_full_name} (ID: {github_repo_id})")
    except Exception as e:
        print(f"[DB] Error saving repository: {e}")
