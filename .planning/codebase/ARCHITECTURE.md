# Architecture

## System Overview
Orbiter (RepoMind) is an event-driven AI maintainer system. It operates as a reactive monolith that transforms GitHub webhooks into autonomous actions using ML and RAG.

## Key Design Patterns
- **Webhook-to-Background-Task**: Immediate acknowledgment of GitHub events (under 10s) followed by async processing in FastAPI BackgroundTasks.
- **Multi-collection RAG**: Separate vector search collections for Code, Docs, Issues, and Commits to provide specialized context to the LLM.
- **Idempotency Guard**: delivery_id tracking in SQLite/Supabase to prevent processing the same webhook multiple times.
- **Fallback Orchestration**: LLM router that switches from Gemini to Groq if primary services are unavailable.

## Component Breakdown
- **FastAPI Layer**: signature verification, event routing, and background task dispatching.
- **Pipeline Layer**: Modularized logic for Issue Triage, Contributor Help, and Commit Analysis.
- **AI Core**: ML classification for speed, LangChain agents for complex decision making.
- **Persistence Layer**: ChromaDB for semantic search, Supabase for relational data.
- **Frontend Layer**: Next.js dashboard for real-time monitoring of AI activity.
