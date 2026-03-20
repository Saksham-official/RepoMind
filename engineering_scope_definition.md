# Engineering Scope Definition

## 1. Context and Goals
The objective is to build RepoMind as an autonomous AI GitHub repository intelligence layer over a 4-week MVP timeframe. The project aims to demonstrate advanced ML/LLM orchestration, real-time push architectures (WebSockets), and an elegant frontend designed with terminal aesthetics. 

## 2. In-Scope for MVP (Phase 1)
- **Monitored Services:** Public GitHub repositories only.
- **Background Intelligence:** 24/7 autonomous polling using APScheduler running alongside the FastAPI instance.
- **RAG + Embedding Pipeline:** Using `.pkl` RandomForest logic alongside ChromaDB vector storage (for code chunks) powered by `BAAI/bge-base-en-v1.5`.
- **LLM Integrations:**
  - Primary: Google Gemini 1.5 Flash.
  - Fallback: Groq API (Llama 3.1 70B).
- **Frontend App:** Next.js App Router providing a dashboard, live activity feed via WebSocket, and commit feeds.
- **Route Protections:** Enforcement using Edge runtime `middleware.ts`.
- **Infrastructure Strategy:** 100% free cloud services (Koyeb, Vercel, Supabase, Upstash, Resend).

## 3. Out-of-Scope for MVP (Phase 1)
- **Private Repositories:** Requires deeper GitHub OAuth scopes not targeted for the initial release.
- **Alternative VCS Systems:** GitLab, Bitbucket, Azure DevOps are completely excluded.
- **Team Collaboration features:** B2B features like organizational grouping or single-sign-on.
- **Monetization & Payments:** Stripe billing layers.
- **Mobile Native Applications:** Only web-responsive UI.

## 4. Phase 2 Expansions (Future Consideration)
- Direct Codebase Q&A Chatbots ("What does the auth module do?").
- Aggregated Commit Risk Score (incorporating deletion ratios and coverage drops).
- Bus Factor Analyzers.
- PR intelligence and auto-summarization on draft status.
- Migrating ML classifier to fine-tuned DistilBERT models.
