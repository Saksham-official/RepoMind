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
        print("[WARNING] SUPABASE_URL or SUPABASE_KEY not set in environment. Skipping DB operations.")
        return None
        
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def log_ai_action(github_repo_id: str, target_number: int, event_type: str, reasoning: str, confidence_score: float = 1.0, evidence_used: dict = None):
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
            "confidence_score": confidence_score,
            "evidence_used": evidence_used or {},
            "status": "active",
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

def save_teach_rule(repo_id: str, old_label: str, new_label: str):
    """Saves a maintainer correction rule."""
    client = get_db_client()
    if not client: return
    
    data = {
        "repo_id": repo_id,
        "old_label": old_label,
        "new_label": new_label,
        "applied": False
    }
    try:
        client.table("teach_rules").insert(data).execute()
        print(f"[DB] Saved teach rule: {old_label} -> {new_label}")
    except Exception as e:
        print(f"[DB] Error saving teach rule: {e}")

def update_contributor_journey(repo_id: str, username: str, milestone: str):
    """Updates a contributor's journey milestones."""
    client = get_db_client()
    if not client: return
    
    try:
        # Check if contributor exists
        resp = client.table("contributor_journeys").select("*").eq("repo_id", repo_id).eq("github_username", username).execute()
        
        timestamp = "NOW()" # In real Supabase this would be handled by DB or python datetime
        from datetime import datetime
        now = datetime.now().isoformat()

        if not resp.data:
            # Create new entry
            data = {
                "repo_id": repo_id,
                "github_username": username,
                "milestones_achieved": [milestone]
            }
            if milestone == "first_issue": data["first_issue_at"] = now
            elif milestone == "first_pr": data["first_pr_at"] = now
            elif milestone == "first_merge": data["first_merge_at"] = now
            
            client.table("contributor_journeys").insert(data).execute()
        else:
            # Update existing
            existing = resp.data[0]
            milestones = existing.get("milestones_achieved", [])
            if milestone not in milestones:
                milestones.append(milestone)
                update_data = {"milestones_achieved": milestones}
                if milestone == "first_issue" and not existing.get("first_issue_at"): update_data["first_issue_at"] = now
                elif milestone == "first_pr" and not existing.get("first_pr_at"): update_data["first_pr_at"] = now
                elif milestone == "first_merge" and not existing.get("first_merge_at"): update_data["first_merge_at"] = now
                
                client.table("contributor_journeys").update(update_data).eq("id", existing["id"]).execute()
    except Exception as e:
        print(f"[DB] Error updating contributor journey: {e}")
