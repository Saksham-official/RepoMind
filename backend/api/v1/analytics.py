from fastapi import APIRouter, HTTPException
from core.database import get_db_client
from typing import List, Dict

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/contributor_velocity")
async def get_contributor_velocity(repo_id: str = None):
    """
    Returns aggregated contributor activity data.
    If repo_id is provided, filters by repository.
    """
    client = get_db_client()
    if not client:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # Fetch commits to calculate velocity
        query = client.table("commits").select("author, classification, created_at")
        if repo_id:
            query = query.eq("repo_id", repo_id)
        
        resp = query.execute()
        commits = resp.data

        # Aggregate data
        stats = {}
        for c in commits:
            author = c.get("author", "unknown")
            if author not in stats:
                stats[author] = {
                    "username": author,
                    "total_commits": 0,
                    "feat": 0,
                    "fix": 0,
                    "impact_score": 0,
                    "last_active": c.get("created_at")
                }
            
            s = stats[author]
            s["total_commits"] += 1
            cat = c.get("classification")
            if cat == "feat": s["feat"] += 1
            elif cat == "fix": s["fix"] += 1
            
            # Simple impact score heuristic
            # Feats are 10 points, Fixes are 5, others are 2
            if cat == "feat": s["impact_score"] += 10
            elif cat == "fix": s["impact_score"] += 5
            else: s["impact_score"] += 2
            
            if c.get("created_at") > s["last_active"]:
                s["last_active"] = c.get("created_at")

        # Convert to list and sort by impact
        result = list(stats.values())
        result.sort(key=lambda x: x["impact_score"], reverse=True)
        
        return result

    except Exception as e:
        print(f"[ANALYTICS] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/repo_velocity")
async def get_repo_velocity():
    """
    Returns overall repository velocity (commits over time).
    """
    client = get_db_client()
    if not client:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # In a real app, we'd use a group-by query or TimescaleDB
        # For this prototype, we'll just return some mock trends based on real commit counts
        resp = client.table("commits").select("created_at").execute()
        dates = [d["created_at"][:10] for d in resp.data]
        
        # Count per day
        from collections import Counter
        counts = Counter(dates)
        
        # Sort by date
        sorted_dates = sorted(counts.keys())
        return [{"date": d, "count": counts[d]} for d in sorted_dates[-30:]]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from core.ai.digest_agent import get_strategic_insights

@router.get("/strategic_insights")
async def strategic_insights(repo_id: str):
    return get_strategic_insights(repo_id)

@router.get("/relationships")
async def get_relationships(repo_id: str, entity_id: str, entity_type: str):
    client = get_db_client()
    if not client:
        return []
    
    resp = client.table("entity_relationships") \
        .select("*") \
        .eq("repo_id", repo_id) \
        .eq("source_id", entity_id) \
        .eq("source_type", entity_type) \
        .execute()
    return resp.data or []
