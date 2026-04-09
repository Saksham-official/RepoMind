# API Contracts

## 1. Webhooks (GitHub App)
All real-time events from GitHub are pushed to this endpoint.

- **`POST /webhooks/github`**
  - **Headers**:
    - `X-GitHub-Event`: Event type (e.g. `issues`, `pull_request`, `push`, `release`).
    - `X-Hub-Signature-256`: HMAC-SHA256 signature for verification.
    - `X-GitHub-Delivery`: Unique delivery ID for idempotency.
  - **Processing**: Verifies HMAC signature, ensures idempotency, ACKs immediately with `200 OK`, and dispatches the payload to a background task (FastAPI `BackgroundTasks`).

## 2. REST Endpoints (HTTPS)
The backend is powered by FastAPI, prefixed with `/api/v1`.

### A. Authentication
- **`POST /api/v1/auth/login`**: Validate Supabase session or JWT credentials.

### B. Repositories (`/api/v1/repos`)
- **`GET /`**: Fetch all installed repositories for the authenticated user.
- **`POST /`**: Trigger a manual sync or setup for a newly installed repository.
- **`POST /{repo_id}/reindex`**: Manually drop and rebuild the ChromaDB index for a repository.

### C. Webhook & Action Logs
- **`GET /api/v1/repos/{repo_id}/actions`**: Retrieves recent AI actions (audit trail).
- **`GET /api/v1/repos/{repo_id}/issues`**: Retrieves issue triage history.
- **`GET /api/v1/repos/{repo_id}/commits`**: Retrieves commit history and analysis.

### D. System
- **`GET /api/v1/health`**: Simple healthcheck, returning `{"status": "ok"}` for UptimeRobot pings.

## 3. Real-Time Endpoints (WebSockets)
FastAPI native WebSockets used for pushing live activity when users are connected to the dashboard.

- **`WS /api/v1/ws/feed?token={jwt}`**
  - **Connection**: Requires valid Supabase JWT.
  - **Messages Sent from Server**: JSON payloads with specific `type` fields.
    - `{"type": "issue_triaged", "issue_number": 247, "classification": "bug", "actions": ["add_label", "post_comment"]}`
    - `{"type": "question_answered", "issue_number": 301, "confidence": 0.82}`
    - `{"type": "commit_analyzed", "sha": "abc123", "commit_type": "breaking_change"}`
    - `{"type": "error", "message": "Failed to verify webhook payload"}`

## 4. GitHub API (External)
Orbiter uses short-lived installation tokens (valid for 1 hour) cached in Upstash Redis to securely execute commands on the GitHub API on behalf of the "Orbiter Bot" GitHub App.
