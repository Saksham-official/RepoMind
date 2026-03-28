# User Stories and Acceptance Criteria

## 1. User Stories

### Story 1: Issue Bug Triage
**As an** OSS maintainer,
**I want** Orbiter to automatically classify incoming bugs, determine if they are duplicates of existing reported issues, suggest an assignee using git blame history, and immediately post a first-response tracking message.
**So that** I don't have to manually manage my repo's incoming backlog triage.

### Story 2: Answer Contributor Questions
**As a** repository contributor,
**I want to** ask a question about local testing or setup,
**So that** Orbiter's RAG Agent can read past issues, the `CONTRIBUTING.md`, and the codebase to reply directly in the thread within seconds, preventing blocking delays.

### Story 3: Commit Insights Timeline
**As a** team lead,
**I want to** review the `commits` timeline via the Dashboard,
**So that** I can scan badges explicitly classifying patches versus tracking health metrics over breaking codebase integrations.

### Story 4: Live Activity Auditing
**As a** system maintainer,
**I want** to see exactly why Orbiter applied a label or closed a ticket through a streaming WebSocket audit trace (Dashboard Activity Feed),
**So that** I have full visibility and confidence into the agent's autonomous workflow executions.

### Story 5: Real-Time GitHub Webhooks
**As a** GitHub user,
**I want to** install Orbiter natively via a GitHub App installation,
**So that** events trigger immediately via POST webhooks instead of forcing the server to clumsily poll the GitHub REST API every few hours.

---

## 2. Acceptance Criteria

- **GitHub App Setup:** The application must successfully configure isolated installation tokens per repository, strictly adhering to App Rate Limit scaling (5k requests per hour/per repo).
- **Fast Webhook ACKs:** The generic `POST /webhooks/github` route must return an HTTP 200 within under 10 seconds to satisfy GitHub delivery constraints, routing all logic sequentially to `FastAPI BackgroundTasks`.
- **Duplicate Triage:** Issue `bge-base-en` checks against existing collections (`repo_{id}_issues`) must correctly isolate duplication cases, preventing duplicate LLM hallucination and alerting developers correctly.
- **Multi-Collection RAG:** Any RAG queries must draw references from `code`, `docs`, AND `issues` Chroma paths simultaneously. Synthesized answers must explicitly log confidence metrics internally.
- **Auth Enforcement:** Any request to `/dashboard` or `/repo/[id]` without a valid Supabase JWT session must immediately redirect to `/login` with no flash of content via Next.js Edge middleware.
- **Event Audit Logs:** Every distinct LLM trigger must produce an entry in the backend `ai_actions` SQL table detailing the context payload and algorithmic reasoning.
