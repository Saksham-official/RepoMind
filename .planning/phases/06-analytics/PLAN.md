# Phase 06: Analytics & Release Intelligence

**Goal**: Automate changelog generation and implement contributor velocity analytics.

## Plans

### 06-01: Automated Release Assistant
- [ ] Implement `release.published` and `create` (tag) webhook handlers in `backend/api/v1/webhooks.py`.
- [ ] Create `backend/core/ai/release_agent.py` to generate AI-driven changelogs based on commit history since the last tag.
- [ ] Update the GitHub Release body with the generated changelog via the GitHub API.

### 06-02: Contributor Velocity Analytics
- [ ] Add `api/v1/analytics/contributor_velocity` endpoint to fetch aggregated commit/PR data per contributor.
- [ ] Implement churn detection logic (identifying contributors who haven't been active recently).
- [ ] Create a new "Analytics" tab in the frontend dashboard to visualize these insights.

### 06-03: Final Repository Audit & Cleanup
- [ ] Verify `database_schema.md` (in `.planning/codebase`) matches current Supabase schema.
- [ ] Remove unused test scripts and boilerplate files identified in the audit.
- [ ] Run a final health check across all agents to ensure stability.

## UAT Criteria
1. Creating a new tag/release on GitHub triggers a "Changelog Generated" event in the dashboard.
2. The "Analytics" tab shows a list of active contributors and their recent impact scores.
3. Repository root is clean of all legacy/redundant files.
