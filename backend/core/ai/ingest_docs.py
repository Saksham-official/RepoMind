import os
import json

from langchain_community.document_loaders import TextLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings

from core.database import get_db_client

# Lazy-initialized singletons (expensive to load, so only once per process)
_text_splitter = None
_embeddings_model = None


def _get_text_splitter():
    global _text_splitter
    if _text_splitter is None:
        _text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    return _text_splitter


def _get_embeddings_model():
    global _embeddings_model
    if _embeddings_model is None:
        _embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_model


def _is_already_indexed(repo_full_name: str) -> bool:
    """Returns True if Supabase already has embeddings for this repo."""
    client = get_db_client()
    if not client:
        return False
    try:
        result = (
            client.table("repo_embeddings")
            .select("id")
            .eq("repo_name", repo_full_name)
            .limit(1)
            .execute()
        )
        return len(result.data) > 0
    except Exception:
        return False


def _push_chunks_to_supabase(chunks: list, repo_full_name: str, metadata_base: dict = None) -> int:
    """
    Shared helper: embeds text chunks and batch-inserts into Supabase repo_embeddings.
    Clears existing embeddings for the repo first (clean re-index).
    Returns the number of rows inserted.
    """
    if not chunks:
        print(f"[INGEST] No chunks to push for {repo_full_name}.")
        return 0

    client = get_db_client()
    if not client:
        print("[INGEST] ERROR: No Supabase client. Cannot push embeddings.")
        return 0

    # Clear old embeddings for clean re-index
    try:
        client.table("repo_embeddings").delete().eq("repo_name", repo_full_name).execute()
        print(f"[INGEST] Cleared old embeddings for {repo_full_name}")
    except Exception as e:
        print(f"[INGEST] Warning: Could not clear old embeddings: {e}")

    # Generate embeddings
    embeddings_model = _get_embeddings_model()
    print(f"[INGEST] Generating embeddings for {len(chunks)} chunks...")
    embeddings = embeddings_model.embed_documents(chunks)

    # Batch insert (50 rows per batch to stay within Supabase payload limits)
    BATCH_SIZE = 50
    total_inserted = 0

    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i : i + BATCH_SIZE]
        batch_embeddings = embeddings[i : i + BATCH_SIZE]

        rows = []
        for text, emb in zip(batch_chunks, batch_embeddings):
            meta = dict(metadata_base or {})
            meta["repo"] = repo_full_name
            rows.append({
                "repo_name": repo_full_name,
                "content": text,
                "metadata": json.dumps(meta),
                "embedding": emb,
            })

        try:
            client.table("repo_embeddings").insert(rows).execute()
            total_inserted += len(rows)
            print(f"[INGEST] Inserted batch: {len(rows)} rows ({total_inserted}/{len(chunks)})")
        except Exception as e:
            print(f"[INGEST] Error inserting batch: {e}")

    print(f"[INGEST] DONE: {total_inserted} chunks → Supabase pgvector for {repo_full_name}")
    return total_inserted


# ─────────────────────────────────────────────────────────────────────────────
# AUTO-INGEST  (called automatically by the issue triage pipeline)
# ─────────────────────────────────────────────────────────────────────────────

def auto_ingest_from_github(installation_id: int, repo_full_name: str, force_refresh: bool = False) -> bool:
    """
    Fully automatic ingestion:
      1. Uses the GitHub App token (via installation_id) to fetch all .md files from the repo
      2. Splits them into chunks
      3. Pushes embeddings into Supabase pgvector

    Called automatically inside issue_triage when a question is detected.
    Skips ingestion if the repo is already indexed (unless force_refresh=True).

    Returns True on success, False on failure.
    """
    if not force_refresh and _is_already_indexed(repo_full_name):
        print(f"[INGEST] '{repo_full_name}' already indexed. Skipping auto-ingest.")
        return True

    print(f"[INGEST] Auto-ingesting '{repo_full_name}' from GitHub API...")

    # Step 1 — fetch all .md files from the GitHub repo tree
    try:
        from core.github_client import github_fetch_repo_docs
        doc_files = github_fetch_repo_docs(installation_id, repo_full_name)
    except Exception as e:
        print(f"[INGEST] Failed to fetch docs from GitHub: {e}")
        return False

    if not doc_files:
        print(f"[INGEST] No docs found in '{repo_full_name}'. Cannot answer with RAG.")
        return False

    # Step 2 — chunk all fetched files
    splitter = _get_text_splitter()
    all_chunks = []

    for doc in doc_files:
        content = doc["content"].strip()
        if not content:
            continue
        # Prepend filename so Gemini knows the source document
        full_text = f"# File: {doc['filename']}\n\n{content}"
        all_chunks.extend(splitter.split_text(full_text))

    print(f"[INGEST] {len(doc_files)} files → {len(all_chunks)} chunks")

    # Step 3 — embed & store in Supabase
    inserted = _push_chunks_to_supabase(
        chunks=all_chunks,
        repo_full_name=repo_full_name,
        metadata_base={"source": "github_api", "type": "doc"},
    )

    return inserted > 0


# ─────────────────────────────────────────────────────────────────────────────
# MANUAL INGEST  (from a local path — for dev / the /rag/ingest endpoint)
# ─────────────────────────────────────────────────────────────────────────────

def ingest_repo_docs(repo_path: str, repo_full_name: str):
    """
    Ingests docs from a LOCAL directory into Supabase pgvector.
    Use this for local development or the POST /api/v1/rag/ingest endpoint.
    For automatic webhook-triggered ingestion, use auto_ingest_from_github().
    """
    print(f"[INGEST] Local ingestion: '{repo_full_name}' from '{repo_path}'...")

    loader = DirectoryLoader(
        repo_path,
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf8"},
    )

    try:
        documents = loader.load()
    except Exception as e:
        print(f"[INGEST] Error loading documents: {e}")
        return

    if not documents:
        print(f"[INGEST] No .md files found in '{repo_path}'. Skipping.")
        return

    splitter = _get_text_splitter()
    texts = splitter.split_documents(documents)
    raw_chunks = [t.page_content for t in texts]

    _push_chunks_to_supabase(
        chunks=raw_chunks,
        repo_full_name=repo_full_name,
        metadata_base={"source": "local", "type": "doc"},
    )


def ingest_issues(repo_full_name: str, issues: list):
    """
    Ingests a list of issue objects into the vector database.
    Each issue is indexed as a single chunk with metadata.
    """
    if not issues:
        return 0

    print(f"[INGEST] Indexing {len(issues)} issues for '{repo_full_name}'...")

    chunks = []
    for iss in issues:
        # Create a rich text representation of the issue for semantic search
        title = iss.get("title", "")
        body = iss.get("body", "") or ""
        number = iss.get("number", "unknown")
        
        # Format: #25: Issue Title \n Issue Body
        issue_text = f"Issue #{number}: {title}\n\n{body}"
        chunks.append(issue_text)

    return _push_chunks_to_supabase(
        chunks=chunks,
        repo_full_name=repo_full_name,
        metadata_base={"source": "database", "type": "issue"},
    )


def ingest_commits(repo_full_name: str, commits: list):
    """
    Ingests a list of commit objects into the vector database.
    """
    if not commits:
        return 0

    print(f"[INGEST] Indexing {len(commits)} commits for '{repo_full_name}'...")

    chunks = []
    for c in commits:
        sha = c.get("sha", "unknown")[:8]
        msg = c.get("message", "")
        author = c.get("author", "unknown")
        analysis = c.get("agent_analysis", "")
        
        # Format: Commit [sha] by author: message \n AI Analysis
        commit_text = f"Commit {sha} by {author}: {msg}\n\nAI Analysis: {analysis}"
        chunks.append(commit_text)

    return _push_chunks_to_supabase(
        chunks=chunks,
        repo_full_name=repo_full_name,
        metadata_base={"source": "database", "type": "commit"},
    )


def ingest_actions(repo_full_name: str, actions: list):
    """
    Ingests a list of AI action objects into the vector database.
    """
    if not actions:
        return 0

    print(f"[INGEST] Indexing {len(actions)} AI actions for '{repo_full_name}'...")

    chunks = []
    for a in actions:
        event = a.get("event_type", "unknown")
        target = f"{a.get('target_type', 'unknown')} #{a.get('target_number', '0')}"
        reasoning = a.get("reasoning", "")
        
        # Format: Action [event] on target: reasoning
        action_text = f"AI Action ({event}) on {target}: {reasoning}"
        chunks.append(action_text)

    return _push_chunks_to_supabase(
        chunks=chunks,
        repo_full_name=repo_full_name,
        metadata_base={"source": "database", "type": "action"},
    )


if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    load_dotenv()

    if len(sys.argv) > 2:
        ingest_repo_docs(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python ingest_docs.py <local_repo_path> <repo_full_name>")
