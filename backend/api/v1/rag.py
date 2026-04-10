from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/rag", tags=["RAG Search"])


class SearchRequest(BaseModel):
    repo_name: str
    question: str
    match_count: Optional[int] = 5
    match_threshold: Optional[float] = 0.4


class IngestRequest(BaseModel):
    repo_path: str
    repo_name: str


@router.post("/search")
async def rag_search(request: SearchRequest):
    """
    RAG Search endpoint.
    Takes a question and repository name, searches Supabase pgvector for matching
    documentation chunks, then uses Gemini to synthesize an answer.
    """
    from core.ai.contributor_helper import synthesize_answer

    try:
        answer = synthesize_answer(request.repo_name, request.question)
        return {
            "status": "ok",
            "repo_name": request.repo_name,
            "question": request.question,
            "answer": answer,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG search failed: {str(e)}")


@router.post("/search/raw")
async def raw_vector_search(request: SearchRequest):
    """
    Raw vector search endpoint.
    Returns the matching document chunks with similarity scores, without LLM synthesis.
    Useful for debugging or building custom UIs.
    """
    from core.ai.contributor_helper import _search_repo_embeddings

    try:
        matches = _search_repo_embeddings(
            request.repo_name,
            request.question,
            match_count=request.match_count,
            match_threshold=request.match_threshold,
        )
        return {
            "status": "ok",
            "repo_name": request.repo_name,
            "question": request.question,
            "match_count": len(matches),
            "matches": matches,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vector search failed: {str(e)}")


@router.post("/ingest")
async def ingest_docs(request: IngestRequest):
    """
    Manually trigger document ingestion for a repository.
    Loads .md files from the given local path. pushes embeddings to Supabase pgvector.
    """
    from core.ai.ingest_docs import ingest_repo_docs

    try:
        ingest_repo_docs(request.repo_path, request.repo_name)
        return {
            "status": "ok",
            "message": f"Ingestion triggered for {request.repo_name}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
