from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
from typing import List, Optional
from core.database import get_db_client

router = APIRouter(prefix="/copilot", tags=["Maintainer Copilot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    repo_id: str
    messages: List[ChatMessage]

@router.post("/chat")
async def copilot_chat(request: ChatRequest):
    """
    Maintainer Copilot Chat endpoint.
    Provides conversational insights based on repository data.
    """
    client = get_db_client()
    repo_id = request.repo_id
    last_message = request.messages[-1].content.lower()

    if not client:
        return {
            "answer": "Database not connected. I am running in mock mode. Please configure SUPABASE_URL and SUPABASE_KEY.",
            "evidence": []
        }

    evidence = []
    answer = "I'm monitoring the repo activity. Ask me about PR velocity, contributor growth, or specific AI decisions I've made."

    try:
        # 1. RAG over ai_actions to explain past decisions
        if "decision" in last_message or "action" in last_message or "ai" in last_message:
            resp = client.table("ai_actions").select("*").eq("repo_id", repo_id).order("created_at", desc=True).limit(5).execute()
            if resp.data:
                answer = "Here are my recent decisions:\n"
                for action in resp.data:
                    event = action.get('event_type')
                    target = action.get('target_number')
                    conf = action.get('confidence_score')
                    reasoning = action.get('reasoning')
                    answer += f"- {event} on issue/PR #{target} (Confidence: {conf})\n"
                    if reasoning:
                        evidence.append(f"#{target}: {reasoning}")
            else:
                answer = "I haven't made any recent autonomous decisions for this repository."

        # 2. RAG over contributor_journeys to suggest mentorship
        elif "contributor" in last_message or "mentor" in last_message:
            resp = client.table("contributor_journeys").select("*").eq("repo_id", repo_id).execute()
            if resp.data:
                answer = "Here are the recent contributor milestones I'm tracking:\n"
                for c in resp.data:
                    milestones = c.get('milestones_achieved', [])
                    username = c.get('github_username')
                    answer += f"- @{username}: Achieved {', '.join(milestones)}\n"
                    if "first_merge" in milestones:
                        evidence.append(f"@{username} might be ready for mentorship since they just had their first merge.")
            else:
                answer = "I haven't tracked any new contributor milestones yet."

        # 3. Repository velocity (mocked as no table exists yet for PR stats)
        elif "pr" in last_message and "taking longer" in last_message:
            answer = "Based on the last 30 days, PR review time has increased by 15%. This coincides with a 20% increase in incoming PRs and a decrease in activity from 2 core maintainers."
            evidence.append("PR velocity decreased from 2.1 days to 2.8 days")
            evidence.append("Maintainer @alice hasn't reviewed in 10 days")

    except Exception as e:
        answer = f"I encountered an error while analyzing the repository data: {e}"

    return {
        "answer": answer,
        "evidence": evidence
    }
