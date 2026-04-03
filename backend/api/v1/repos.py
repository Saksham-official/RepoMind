from fastapi import APIRouter, HTTPException, Depends
from typing import List
from core.database import get_db_client
import json

router = APIRouter(prefix="/repos", tags=["Repositories"])

@router.get("", response_model=List[dict])
async def list_repositories():
    """List all indexed repositories from Supabase"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        response = client.table("repositories").select("*").execute()
        # Return properly mapped objects
        return [{
            "id": r["id"],
            "owner": r.get("owner", "unknown"),
            "repo_name": r.get("repo_name", "unknown"),
            "installation_id": r.get("installation_id"),
            "is_indexed": r.get("is_indexed", False),
            "health_score": r.get("health_score", 50),
            "last_indexed_at": r.get("last_indexed_at"),
            "last_checked_at": r.get("last_checked_at"),
            "created_at": r.get("created_at")
        } for r in response.data]
    except Exception as e:
        print(f"Error fetching repos: {e}")
        return []

@router.get("/{repo_id}/actions", response_model=List[dict])
async def list_repo_actions(repo_id: str):
    """List recent AI actions for a specific repository"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        # Fetch actions and order by newest first
        response = client.table("ai_actions")\
            .select("*")\
            .eq("repo_id", repo_id)\
            .order("created_at", desc=True)\
            .limit(10)\
            .execute()
            
        return [{
            "id": a["id"],
            "repo_id": a["repo_id"],
            "event_type": a["event_type"],
            "target_type": a["target_type"],
            "target_number": a.get("target_number", 0),
            "actions_taken": a.get("actions_taken", []),
            "reasoning": a.get("reasoning", ""),
            "ml_classification": a.get("ml_classification", {}),
            "created_at": a["created_at"]
        } for a in response.data]
    except Exception as e:
        print(f"Error fetching actions for {repo_id}: {e}")
        return []
