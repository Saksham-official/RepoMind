# Environment and DevOps

## deployed Infrastructure Overview
RepoMind utilizes 100% free-tier cloud tooling, keeping operational overhead at $0 while matching production-ready infrastructure best practices.

1. **Backend / API Engine (Koyeb)**
   - Deploys the monolithic Dockerized FastAPI + Uvicorn server (`python:3.11-slim`).
   - Attached 1GB persistent disk mapped exclusively for the ChromaDB vector collections (`/app/chroma_db`).
   - Automatically restarts logic handled natively. Continuous background execution via APScheduler does not pause, fulfilling the "always on" requirements.

2. **Frontend UI (Vercel)**
   - Connects to the GitHub repository to trigger automatic branch-based deployments.
   - Leverages Vercel edge network for `middleware.ts` execution (Next.js Edge Runtime), allowing zero-latency authentication routing checks entirely server-side.

3. **Database & Auth (Supabase)**
   - Serves as the primary Postgres datastore for all structural relational abstractions.
   - Built-in `auth.users` integrations handling secure JWT generation for the backend and WebSocket validations.

4. **Cache & Rate Limiting (Upstash Redis)**
   - Protects the FastAPI instance from abusive request volumes natively caching commonly repeated requests (e.g. ML classification of "fix: typo").

## Environment Variables Configuration
The raw values are mapped exclusively to the vendor dashboards (Koyeb & Vercel) and never committed to source control.

```env
# Primary external auth
GEMINI_API_KEY=********
GROQ_API_KEY=********
GITHUB_TOKEN=********

# Vendor DB logic
SUPABASE_URL=********
SUPABASE_ANON_KEY=********
SUPABASE_SERVICE_KEY=********
UPSTASH_REDIS_URL=********
UPSTASH_REDIS_TOKEN=********
RESEND_API_KEY=********

# Project Config
JWT_SECRET_KEY=********
FRONTEND_URL=https://your-app.vercel.app
CHROMA_PERSIST_DIR=/app/chroma_db
ENVIRONMENT=production
```

## Continuous Integration / Continuous Deployment (CI/CD)
The monolithic repository contains a GitHub Actions workflow `.github/workflows/deploy.yml` that performs validation pipelines upon pushing to `main`.
1. Provisions Python 3.11 instance on Ubuntu runner.
2. Installs requirements via `pip` and executes tests using `pytest tests/ -v`.
3. If build/test matrix passes, uses Koyeb generic REST webhooks via `curl -X POST` to execute the redeployment signal to update the backend instance automatically.
