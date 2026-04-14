# Orbiter (RepoMind) - MVP Implementation Checklist

Here is the master checklist tracking the execution of the Product Requirements Document (PRD) and Development Phases.

## ✅ Phase 1: MVP (Week 1) - Core Setup & ML Model
- [x] Set up GitHub App and establish Webhook receipt endpoint (`POST /webhooks/github`).
- [x] Implement robust HMAC-SHA256 verification and delivery-ID based idempotency logic.
- [x] Train the unified Commit and Issue text classifier (RandomForest + TF-IDF) on public datasets.

## ✅ Phase 1: MVP (Week 2) - AI Pipelines
- [x] Implement the Issue Triage Agent: Duplicate detection (ChromaDB), ML classification, LangChain reasoning, and GitHub API writes (labels, comments).
- [x] Implement the Contributor Helper: Multi-collection RAG search (docs + issues) and answer synthesis.
- [x] Port over Commit Intelligence (from prior version) into the webhook flow.

## ✅ Phase 1: MVP (Week 3) - Backend & Database
- [x] Structure the database in Supabase (PostgreSQL tables for auth, repos, actions, issues, webhooks).
- [x] Set up Upstash Redis caching for GitHub installation tokens.
- [x] Enable WebSockets for live activity streaming.
- [x] Add the `APScheduler` routine for polling fallbacks, cache invalidations, and email digests.

## ✅ Phase 1: MVP (Week 4) - Frontend Development
- [x] Build the Next.js 14 App Router application.
- [x] Build the Dashboard, Repo drill-down, Action Cards, Commit Feed, and Terminal Loader.
- [x] Integrate visually appealing styles using Tailwind, Framer Motion, and GSAP.

## ✅ Phase 1: MVP (Week 5) - Polish & Deployment
- [x] Deploy backend to Koyeb with persistent disk for ChromaDB.
- [x] Deploy frontend to Vercel.
- [x] End-to-end testing with a real test repository.

---

## 🔒 Advanced Unique Features (Completed Workframes)
- [x] **"Self-Healing" Documentation:** RAG answer synthesis architecture.
- [x] **Toxicity & Maintainer Burnout Detection:** Framework built into `webhooks.py`.
- [x] **"Blast Radius" PR Prediction:** (Awaiting PR Reviewer implementation).
- [x] **Contributor "Expertise" Mapping:** (Awaiting `git blame` processing module).
