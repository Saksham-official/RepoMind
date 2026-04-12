# Integrations

## Primary Integrations
- **GitHub App**: Real-time event delivery via webhooks, installation-level authentication, and API access (Issues, PRs, Commits).
- **Supabase**: 
    - **PostgreSQL**: Stores persistent application state, audit trails (ai_actions), and repo metadata.
    - **Auth**: Google OAuth for dashboard access.
    - **Storage**: Unstructured data if needed.
- **Upstash Redis**: Used for caching GitHub installation tokens, ML classification results, and rate limiting.
- **Resend**: Email delivery service for daily activity digests.

## AI Services
- **Google AI (Gemini)**: Main LLM for RAG synthesis and agentic reasoning.
- **Groq**: High-speed fallback LLM for Llama models.
- **HuggingFace**: Provides embedding models (bge-base) for vector search.

## Monitoring & Health
- **UptimeRobot**: External monitoring of the `/health` endpoint on Koyeb.
- **WebSocket**: Live feed of AI actions to the dashboard using FastAPI's native support.
