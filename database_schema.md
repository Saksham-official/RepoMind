# Database Schema

Orbiter uses **Supabase PostgreSQL** for structured relational data, and a persisted **ChromaDB** volume for high-dimensional vector embeddings.

## 1. Supabase Postgres Tables

### `repositories`
Tracks installed GitHub repositories.
- **id**: UUID (Primary Key)
- **user_id**: UUID (References auth.users)
- **installation_id**: BIGINT (GitHub App installation)
- **github_repo_id**: BIGINT
- **owner**: TEXT
- **repo_name**: TEXT
- **is_indexed**: BOOLEAN
- **last_indexed_at**: TIMESTAMPTZ
- **last_checked_at**: TIMESTAMPTZ
- **health_score**: INT (Default 50)
- **created_at**: TIMESTAMPTZ

### `ai_actions`
All AI actions taken (full audit trail).
- **id**: UUID (Primary Key)
- **repo_id**: UUID (References repositories.id)
- **event_type**: TEXT ('issue_triage', 'contributor_help', 'commit_analysis')
- **github_event_id**: TEXT (Idempotency mapping)
- **target_type**: TEXT ('issue', 'pr', 'commit')
- **target_number**: INT (Issue/PR number)
- **actions_taken**: JSONB (List of actions, e.g. `[{"type": "add_label"}]`)
- **reasoning**: TEXT (Agent's explanation)
- **ml_classification**: JSONB
- **created_at**: TIMESTAMPTZ

### `webhook_events`
Webhook event log for idempotency and debugging.
- **id**: UUID (Primary Key)
- **delivery_id**: TEXT (UNIQUE, GitHub X-GitHub-Delivery header)
- **event_type**: TEXT
- **repo_full_name**: TEXT
- **payload**: JSONB
- **processed**: BOOLEAN
- **error**: TEXT
- **received_at**: TIMESTAMPTZ

### `commits`
Processed commits.
- *(Standard fields including sha, message, author, commit_type, is_breaking, reasoning)*

### `issues`
Processed issues.
- *(Standard fields including github_issue_id, title, classified_type, is_duplicate, duplicate_of, suggested_owner)*

### `notification_settings`
User notification preferences.
- **user_id**: UUID (Primary Key)
- **email_frequency**: TEXT (e.g. 'daily')
- **alert_on_breaking**: BOOLEAN
- **alert_on_duplicate_issue**: BOOLEAN

## 2. Vector Database (ChromaDB)
Hosted directly on disk alongside the FastAPI server (`CHROMA_PERSIST_DIR`). Uses `BAAI/bge-base-en-v1.5` embeddings.

### Collections per Repo:
1. `repo_{id}_code`: Function-level code chunks for duplicate detection context & owner suggestion.
2. `repo_{id}_docs`: README, contributing guides, and docs for contributor help queries.
3. `repo_{id}_issues`: Resolved issues for duplicate context and historical answers.
4. `repo_{id}_commits`: Commit messages and summaries.
