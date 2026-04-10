# Development Phases

The project is structured around a rapid MVP to establish the foundations of an autonomous AI maintainer layer.

## Phase 1 — MVP (Weeks 1–5)

### Week 1: Core Setup & ML Model
- Set up GitHub App and establish Webhook receipt endpoint (`POST /webhooks/github`).
- Implement robust HMAC-SHA256 verification and delivery-ID based idempotency logic.
- Train the unified Commit and Issue text classifier (RandomForest + TF-IDF) on public datasets.

### Week 2: AI Pipelines
- Implement the **Issue Triage Agent**: Duplicate detection (via ChromaDB), ML classification, LangChain reasoning, and GitHub API writes (labels, comments).
- Implement the **Contributor Helper**: Multi-collection RAG search (docs + issues) and answer synthesis.
- Port over Commit Intelligence (from prior version) into the webhook flow.

### Week 3: Backend & Database
- Structure the database in Supabase (PostgreSQL tables for auth, repos, actions, issues, webhooks).
- Set up Upstash Redis caching for GitHub installation tokens.
- Add the `APScheduler` routine for polling fallbacks, cache invalidations, and email digests.
- Enable WebSockets for live activity streaming.

### Week 4: Frontend Development
- Build the Next.js 14 App Router application.
- Secure routing using Vercel Edge `middleware.ts`.
- Build the Dashboard, Repo drill-down, Action Cards, Commit Feed, and Terminal Loader.
- Integrate visually appealing styles using Tailwind, Framer Motion, and GSAP.

### Week 5: Polish & Deployment
- Deploy backend to Koyeb with persistent disk for ChromaDB.
- Deploy frontend to Vercel.
- End-to-end testing with a real test repository.
- Write documentation, record final project demo, and build the portfolio.

## Phase 2 (Post-MVP)
- **PR Reviewer:** On `pull_request.opened`, fetch diffs, run linters locally, analyze with RAG for context, and post inline GitHub reviews mapping exact diff lines.
- **Release Assistant:** Draft structured changelogs on `release.created`.
- **Auto-close Stale Issues:** Cron-job driven comments and cleanup for ghosted issues.
