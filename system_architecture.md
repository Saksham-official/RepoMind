# System Architecture

## 1. High-Level Architecture
RepoMind follows an **event-driven agent monolith** design. It operates primarily as a background intelligence engine (via APScheduler) paired with an interactive frontend.

- **Frontend:** Next.js 14 deployed on Vercel.
- **Backend:** FastAPI (Python 3.11) deployed on Koyeb.
- **Database:** Supabase (PostgreSQL for metadata, Supabase Auth, Storage).
- **Vector Store:** ChromaDB running locally on Koyeb's persistent disk.
- **Cache / Rate Limiting:** Upstash Redis.

## 2. Core Operational Pipeline

1. **Polling:** APScheduler runs continuously (every 30 mins) to poll the GitHub API for new commits on registered repositories.
2. **ML Classification:** The FastAPI backend passes the commit text and diff stats through a locally hosted `.pkl` scikit-learn Random Forest model. Uncovers the underlying intent (e.g., bug, feature, breaking).
3. **Agent Orchestration:** A LangChain ReAct Agent initializes (using Gemini 1.5 Flash or Groq Llama 3.1 as fallback).
4. **Tool Use:** The agent dynamically acts using:
   - `get_commit_diff` (GitHub API)
   - `search_codebase` (ChromaDB RAG search)
   - `find_related_issues` (GitHub API semantic keyword match)
   - `post_github_comment` (Action execution via API)
5. **Data Post-Processing:** The agent summary and ML metadata are stored in Supabase PostgreSQL.
6. **Delivery:** Events are broadcasted to the frontend via WebSockets and critical alerts trigger emails via Resend.

## 3. RAG and Embedding Design
- **Indexer:** Chunks Python/JS/TS code using `RecursiveCharacterTextSplitter`. Excludes binaries.
- **Embedding Model:** `BAAI/bge-base-en-v1.5` (Runs locally in backend container).
- **Storage Strategy:** Stores separate Collections per repo to prevent crossover (`repo_{id}_code`, `repo_{id}_commits`).

## 4. Scalability Approach
- **Current (Monolith):** Single Koyeb container managing web server, scheduler, and ChromaDB. Cost: $0.
- **Next Tier:** Add paid Koyeb node, migrate ChromaDB to Pinecone Starter, switch to Supabase Pro.
- **Long Term:** Decouple APScheduler into dedicated workers, introduce a task queue (e.g. Redis + Celery/BullMQ), scale API nodes horizontally.
