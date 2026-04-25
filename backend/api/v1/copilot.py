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

from core.ai.contributor_helper import synthesize_answer
from core.database import get_db_client

@router.post("/chat")
async def copilot_chat(request: ChatRequest):
    """
    Maintainer Copilot Chat endpoint.
    Provides conversational insights based on repository data.
    """
    repo_id = request.repo_id
    last_message = request.messages[-1].content
    
    client = get_db_client()
    repo_full_name = "unknown"
    
    if client:
        try:
            repo_resp = client.table("repositories").select("owner, repo_name").eq("id", repo_id).execute()
            if repo_resp.data:
                repo_full_name = f"{repo_resp.data[0]['owner']}/{repo_resp.data[0]['repo_name']}"
        except Exception as e:
            print(f"[COPILOT] Error fetching repo name: {e}")

    try:
        # Use our RAG synthesizer for the answer
        # We pass the repo_full_name to scope the search
        answer = synthesize_answer(repo_full_name, last_message)
        
        return {
            "answer": answer,
            "evidence": [] # evidence is now part of the synthesized answer
        }
    except Exception as e:
        print(f"[COPILOT] Error: {e}")
        return {
            "answer": f"I'm sorry, I'm having trouble analyzing the repository context right now. Error: {str(e)}",
            "evidence": []
        }
