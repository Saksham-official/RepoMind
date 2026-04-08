# Engineering Scope Definition

## 1. Context and Goals
The objective is to build **Orbiter**—an autonomous AI maintainer for open-source GitHub repositories. Functioning as a GitHub App, Orbiter processes real-time webhook events to handle bug triage, respond to contributor questions, and audit commits without human oversight.

## 2. In-Scope for MVP (Phase 1)
- **Monitored Services:** Public GitHub repositories where the Orbiter GitHub App is installed.
- **Real-Time Execution:** Webhook-driven monolith. Events are received, verified (HMAC), ACK'd in < 10s, and processed securely via background tasks.
- **RAG + Embeddings:** Multi-collection ChromaDB search leveraging `BAAI/bge-base-en-v1.5`. Repos are parsed into distinct collections (`code`, `docs`, `issues`, `commits`).
- **Unified ML Classifier:** A tailored local Random Forest + TF-IDF `.pkl` model tracking confidence levels on both issues and commits at <10ms inference time.
- **Autonomous Agent Layers:** 
  - Issue Triage Agent (Labeling, Duplicate Detection, Assignment Suggestions, First Response).
  - Contributor Helper (RAG over docs to answer questions dynamically).
- **Frontend App:** Next.js App Router (Middleware protected), Live Activity Feed (FastAPI WebSockets), AI Audit trails.
- **Infrastructure:** 100% Free Tier (Koyeb, Vercel, Supabase, Upstash Redis, Resend).

## 3. Out-of-Scope for MVP
- **Private Repositories:** Requires deeper user mapping and OAuth integration out of scope for MVP.
- **Other VCS Providers:** GitLab, Bitbucket.
- **CI Suite Execution:** Orbiter will not trigger dynamic code execution (e.g. `pytest`) of user code environments due to sandboxing scope.
- **Direct Monitization and Paywalls.**

## 4. Phase 2 Expansions (Weeks 6-9)
- Pull Request Autonomous Reviewer (Inline Diff Commenting).
- Release Note and Changelog Assistant capabilities.
- Near-duplicate PR detection.
- Auto-closer for stale issues.
