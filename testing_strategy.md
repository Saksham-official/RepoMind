# Testing Strategy

Given the scope and constraints of a 5-week MVP, testing revolves around critical path execution—verifying that the agent acts as expected and data is parsed robustly without wasting compute tokens.

## 1. Unit Testing
Using `pytest` as the primary harness. 
- **Webhook Handlers**: Validate the HMAC-SHA256 verification securely halts unauthorized requests, and returns `200 OK` accurately on mocked valid payloads.
- **ML Classifier Tests**: Validate that the serialized `.pkl` RandomForest model reliably differentiates `bug`, `feature`, and `question` labels on short text fields (both issues and commits).
- **Agent Tools Verification**: Each LangChain tool function (`search_codebase`, `get_commit_diff`, `find_related_issues`) must be executed against static mock data using HTTPX testing frameworks. They MUST NOT hit live APIs (to prevent token waste).
- **Idempotency Locks**: Ensure the `X-GitHub-Delivery` caching safely blocks duplicate event runs entirely logic-side.

## 2. Integration Testing
- **Database / Supabase Constraints**: Validate relations hold firm (e.g. tracking `webhook_events`, `ai_actions`, and `issues` per `repo_id`).
- **ChromaDB Multi-Collection Flow**: Validate writing to multiple separate collections simultaneously (`repo_{id}_code`, `repo_{id}_docs`) and executing a cross-encoder RAG query spanning all groups.
- **Webhook-to-Worker Chain**: Mocking a FastAPI `BackgroundTasks` orchestration request validating it flows gracefully without crashing the Uvicorn thread.

## 3. End-to-End Analysis (E2E)
- Run a dummy `repo_id` through the full orchestration logic manually by triggering the local Webhook emulator pointing to a designated `test_repo`.
- Validate the full output: verify that GitHub Labels were actually applied on the testing repository (e.g., `question` and `answered`) and the comment was successfully posted citing the real documents via RAG.
- Ensure the `ai_actions` logic triggers the Supabase table inserts successfully, cascading into a live WebSocket update broadcast.

## 4. Automation and CI/CD Runbook
The CI/CD pipeline built via GitHub Actions automatically calls `pytest` upon commits towards the `main` branch. 
- It validates that basic Python module structures hold up (i.e., avoiding syntax omissions).
- Skips deploying the application to the Koyeb instance if any test cases fail, preventing erroneous production states.
