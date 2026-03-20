# Testing Strategy

Given the scope and constraints of a 4-week MVP, testing revolves around critical path execution—verifying that the agent acts as expected and data is parsed robustly without wasting compute tokens.

## 1. Unit Testing
Using `pytest` as the primary harness. 
- **ML Classifier Tests**: Validate that the serialized `.pkl` RandomForest model reliably differentiates `bug_fix` versus `feature` commits during loading.
- **Agent Tools Verification**: Each LangChain tool function (`get_commit_diff`, `find_related_issues`) must be executed against static mock data (using `responses` or `HTTPX` unittesting mock libraries). They MUST NOT hit live APIs (to prevent token waste).
- **Endpoint Contracts**: Validate expected JSON schemas on key endpoints (`/api/v1/commits`) to ensure downstream frontend consumers map successfully.

## 2. Integration Testing
- **Database / Supabase Constraints**: Validate relations holding firm (e.g. ensuring `commits` cannot post referencing a missing `repo_id`).
- **ChromaDB Flow**: Validate writing a mocked AST array segment into ChromaDB collections and fetching it correctly based on a mocked embedding string.
- **WebSocket Handshake**: Script an initial JWT WebSocket upgrade token to confirm connection drops when an invalid signature is provided.

## 3. End-to-End Analysis (E2E)
- Run a dummy `repo_id` through the full orchestration logic manually by posting to `/api/v1/repos`. Provide a real GitHub API token to mock a sample commit polling loop, and visually compare the LLM JSON evaluation inserted in Supabase.
- Verify `is_breaking: true` payloads securely hit the `send_breaking_change_alert` Resend email loop reliably.

## 4. Automation and CI/CD Runbook
The CI/CD pipeline built via GitHub Actions automatically calls `pytest` upon commits towards the `main` branch. 
- It validates that basic Python module structures hold up (i.e., avoiding syntax omissions).
- Skips deploying the application to the Koyeb instance if any test cases fail, preventing erroneous production states.
