from fastapi import APIRouter, HTTPException, Depends
from typing import List
from core.database import get_db_client
import json

router = APIRouter(prefix="/repos", tags=["Repositories"])

from core.auth import get_current_user

@router.get("", response_model=List[dict])
async def list_repositories(user_id: str = Depends(get_current_user)):
    """List all indexed repositories for the authenticated user"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        # Filter by user_id
        response = client.table("repositories").select("*").eq("user_id", user_id).execute()
        # Return properly mapped objects
        results = [{
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
        
        if not results:
            return []
        return results
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

@router.get("/{repo_id}/commits", response_model=List[dict])
async def list_repo_commits(repo_id: str):
    """List recent commits for a specific repository"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        response = client.table("commits")\
            .select("*")\
            .eq("repo_id", repo_id)\
            .order("committed_at", desc=True)\
            .limit(20)\
            .execute()
            
        return response.data
    except Exception as e:
        print(f"Error fetching commits for {repo_id}: {e}")
        return []

@router.get("/{repo_id}/issues", response_model=List[dict])
async def list_repo_issues(repo_id: str):
    """List recent issues for a specific repository"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        response = client.table("issues")\
            .select("*")\
            .eq("repo_id", repo_id)\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
            
        return response.data
    except Exception as e:
        print(f"Error fetching issues for {repo_id}: {e}")
        return []
@router.get("/actions/recent", response_model=List[dict])
async def list_recent_actions(user_id: str = Depends(get_current_user)):
    """List most recent AI actions for repositories owned by the user"""
    client = get_db_client()
    if not client:
        return []
    
    try:
        # First find user's repo IDs
        repo_resp = client.table("repositories").select("id").eq("user_id", user_id).execute()
        repo_ids = [r["id"] for r in repo_resp.data]
        
        if not repo_ids:
            return []

        response = client.table("ai_actions")\
            .select("*, repositories(repo_name, owner)")\
            .in_("repo_id", repo_ids)\
            .order("created_at", desc=True)\
            .limit(20)\
            .execute()
            
        results = [{
            "id": a["id"],
            "repo_id": a["repo_id"],
            "repo_name": a.get("repositories", {}).get("repo_name", "unknown") if a.get("repositories") else "unknown",
            "event_type": a["event_type"],
            "target_type": a["target_type"],
            "target_number": a.get("target_number", 0),
            "reasoning": a.get("reasoning", ""),
            "created_at": a["created_at"]
        } for a in response.data]

        if not results:
            return []
        return results
    except Exception as e:
        print(f"Error fetching global actions: {e}")
        return []
