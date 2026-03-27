# System Architecture

*Reference: See also [architecture.md](./architecture.md) and [system_design.md](./system_design.md) for deeply technical overviews.*

## 1. High-Level Architecture
Orbiter follows an **Event-driven webhook monolith** styling.

- **GitHub App:** Replaces the legacy Personal Access Token polling approach. Provides per-installation token isolation, dynamic event subscriptions, unlimited usage via authenticated paths, and HMAC verification.
- **Frontend Dashboard:** Next.js 14 App Router, deployed on Vercel. Features a full audit trail of AI Actions.
- **Backend:** FastAPI (Python 3.11) deployed on Koyeb. Handles synchronous ACKs under 10s and invokes asynchronous LangChain processing pipelines. Maintains an APScheduler routine for robust fallbacks.
- **Vector Engine:** Local ChromaDB parsing repos into multiple collections (`code`, `docs`, `commits`, `issues`). Hosted via a persistent block disk natively.
- **Primary Database:** Supabase Postgres.
- **State caching:** Upstash Redis (caching GitHub API limits and caching text classification / git-blame results).
- **LLM Selection:** LangChain ReAct architectures driving *Gemini 1.5 Flash* with *Groq Llama 3* as a free redundant fallback wrapper. Machine learning uses an internal Scikit-Learn RandomForest mapping `.pkl`.

## 2. Delivery & Execution
- **Webhooks:** Triggering instantly based on issues opened, PR opened, commits pushed, or comments made. Orbiter validates the HMAC secret securely.
- **AI Action Layer:** Actions aren't just notifications—Orbiter writes dynamically back to GitHub using `POST` or `PATCH` on issues through an autonomous agent.
- **Activity Feed:** Connects via FastAPI WebSockets to push live update packets back to the connected client.
