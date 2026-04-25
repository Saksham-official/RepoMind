# Phase 05: PR Intelligence & Automation

**Goal**: Automate PR reviews, implement command-capable mentions, and ensure dashboard reliability.

## Plans

### 05-01: PR Review Pipeline
- [ ] Implement `pull_request.opened` and `pull_request.synchronize` webhook handlers in `backend/main.py`.
- [ ] Create `backend/agents/pr_reviewer.py` to analyze diffs and provide architectural feedback.
- [ ] Post review comments to GitHub via `octokit` (or python equivalent).

### 05-02: Mention & Command Responder
- [ ] Implement `issue_comment.created` handler for `@orbiter` mentions.
- [ ] Add command parsing for `/label`, `/assign`, and `/close` via mentions.
- [ ] Integrate with existing agents to answer questions directly in issue comments.

### 05-03: Dashboard Reliability & Health
- [ ] Implement WebSocket heartbeat and auto-reconnect in `frontend/hooks/useActivityFeed.ts`.
- [ ] Add "System Health" indicators to the dashboard sidebar.
- [ ] Clean up legacy documentation files from repository root.

## UAT Criteria
1. Opening a PR triggers an automated review comment within 60 seconds.
2. Commenting `@orbiter label bug` on an issue adds the 'bug' label.
3. Disconnecting the backend causes the dashboard to show a "Disconnected" state and auto-reconnect when back online.
