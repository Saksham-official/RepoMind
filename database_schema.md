# Database Schema

RepoMind uses **Supabase PostgreSQL** for structured relational data, and a persisted **ChromaDB** volume for high-dimensional vector embeddings.

## 1. Supabase Postgres Tables

### `repositories`
Tracks monitored GitHub repositories for each user.
- **id**: UUID (Primary Key)
- **user_id**: UUID (References auth.users)
- **github_url**: TEXT
- **owner**: TEXT
- **repo_name**: TEXT
- **is_indexed**: BOOLEAN (Tracks initial indexing state)
- **last_checked_at**: TIMESTAMPTZ (For APScheduler tracking)
- **health_score**: FLOAT (Precomputed caching score)
- **created_at**: TIMESTAMPTZ

### `commits`
Stores analysis output from the ML Classifier and LangChain Agent.
- **id**: UUID (Primary Key)
- **repo_id**: UUID (References repositories.id)
- **sha**: TEXT
- **message**: TEXT
- **author**: TEXT
- **committed_at**: TIMESTAMPTZ
- **commit_type**: TEXT (e.g. bug_fix, feature)
- **confidence**: FLOAT
- **is_breaking**: BOOLEAN
- **agent_analysis**: TEXT (The Agent's summary)
- **related_issues**: JSONB (Any issues linked by LLM)
- **comment_posted**: BOOLEAN
- **created_at**: TIMESTAMPTZ

### `agent_events`
Log table for WebSocket replay/audit activity.
- **id**: UUID (Primary Key)
- **repo_id**: UUID (References repositories.id)
- **event_type**: TEXT (e.g. `commit_analyzed`, `reindex_progress`)
- **payload**: JSONB
- **created_at**: TIMESTAMPTZ

### `notification_settings`
User preferences for the email digests.
- **user_id**: UUID (References auth.users, Primary Key)
- **email_frequency**: TEXT (`immediate`, `daily`, `weekly`, `off`)
- **alert_on_breaking**: BOOLEAN
- **updated_at**: TIMESTAMPTZ

## 2. Vector Database (ChromaDB)
Hosted directly on disk alongside the FastAPI server (`CHROMA_PERSIST_DIR`).

### Code Embeddings
- **Collection Name**: `repo_{id}_code`
- **Metadata**: `{file_path, function_name, language, commit_sha}`
- **Vector Dimension**: 768 (`BAAI/bge-base-en-v1.5`)

### Commit Embeddings
- **Collection Name**: `repo_{id}_commits`
- **Metadata**: `{sha, author, date, commit_type}`
- **Vector Dimension**: 768 (`BAAI/bge-base-en-v1.5`)
