# User Stories and Acceptance Criteria

## 1. User Stories

### Story 1: Add a Repository
**As a** developer,
**I want to** add a public GitHub repository URL to RepoMind,
**So that** it can index the codebase and start monitoring future commits.

### Story 2: View Repository Activity
**As a** user,
**I want to** view a live dashboard showing the timeline of commits, 
**So that** I can see the ML classification, confidence score, and LLM summary for each change.

### Story 3: Breaking Change Alerts
**As a** maintainer,
**I want to** receive an immediate email notification when a breaking change is detected,
**So that** I can address potential integration issues before they affect production.

### Story 4: Automated Issue Tracking
**As an** OSS maintainer,
**I want** the agent to automatically find open issues related to a commit and post a comment,
**So that** the community stays updated without me manually linking pull requests to issues.

### Story 5: Manual Re-index
**As a** user,
**I want to** trigger a manual re-indexing of a repository,
**So that** the semantic search stays relevant after massive refactoring or branch merges.

---

## 2. Acceptance Criteria

- **Repo Addition:** The user must be able to paste a valid public GitHub URL. The system should validate the URL and immediately start the background ChromaDB indexing process, keeping the UI unblocked.
- **Indexing Completion:** Provide real-time progress via WebSocket. Upon completion, the repository goes into the `is_indexed` state.
- **Commit Polling:** The APScheduler must run every 30 minutes in the background to fetch new commits, triggering the ML classification and LangChain agent for each.
- **Classification Accuracy:** Commits must be tagged as one of `bug_fix`, `feature`, `breaking_change`, `docs`, `refactor`, or `test`.
- **Live Feed Updates:** New events (commit_analyzed, issue_linked, breaking_detected) must push to the connected browser UI instantly over WebSockets.
- **Auth Enforcement:** Any request to `/dashboard` or `/repo/[id]` without a valid Supabase JWT session must immediately redirect to `/login` with no flash of content.
- **Email Delivery:** Digest emails should successfully dispatch via Resend containing the aggregated statistics for the repository.
