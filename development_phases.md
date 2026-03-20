# Development Phases

The project is structured into a 4-week timeline for rapid MVP execution.

## Week 1 — ML Model + Backend Foundation
- [ ] Collect GitHub commits dataset (via GitHub Archive or manual scraping).
- [ ] Train the Python-based scikit-learn commit classifier to 85%+ accuracy. Save as `.pkl`.
- [ ] Implement local FastAPI application structure and API routes (`/auth`, `/repos`, `/commits`, `/agents`).
- [ ] Draft and provision the `repositories`, `commits`, `notification_settings`, `agent_events` tables in Supabase Postgres.
- [ ] Integrate PyGithub and validate GitHub personal access token (PAT) configurations.
- [ ] Assemble ChromaDB indexer for ingesting a test repository.
- [ ] Deploy `/health` endpoint to Koyeb and hook up UptimeRobot.

## Week 2 — Agent + Monitoring
- [ ] Build and unit test the 5 Custom LangChain tools independently (`get_commit_diff`, `search_codebase`, etc).
- [ ] Wire the LangChain `create_react_agent` on a sample commit payload.
- [ ] Implement `APScheduler` loop; ensure background polling functions without a connected client frontend.
- [ ] Complete WebSocket logic in FastAPI to push real-time events.
- [ ] Create endpoint for `POST /api/v1/repos/{id}/reindex`.
- [ ] Set up Resend transactional emailing logic for Breaking Change Alerts and Daily Digests.
- [ ] Validate end-to-end pipeline: Add Repo > Fetch > Analyze > Detect Breaking > DB Insert + Send Email.

## Week 3 — Frontend Design
- [ ] Write `middleware.ts` to strictly protect private `/dashboard` and `/repo/*` paths.
- [ ] Use `@supabase/auth-helpers-nextjs` for Google OAuth and session management.
- [ ] Build marketing `/` landing page implementing Framer Motion / Magic UI.
- [ ] Develop dashboard layout logic.
- [ ] Build repository drill-down (`/repo/[id]`) with chronological commit cards (incorporating ML Type Badges).
- [ ] Connect WebSocket listener hook in React (`ActivityFeed.tsx`).
- [ ] Build GSAP Radial animated the Health Score components.
- [ ] Test mobile responsiveness across all viewports.

## Week 4 — Testing, Polish, and DevOps
- [ ] Ensure loading skeletons and error fallbacks exist for all async components.
- [ ] Draft comprehensive README including system architecture diagram and feature highlights.
- [ ] Map custom domains using `is-a.dev`.
- [ ] Configure `GitHub Actions` CI/CD for auto-triggering deployment webhooks manually on merging to `main`.
- [ ] Record a 2-minute demo video highlighting the end-to-end product usage and terminal UI design.
