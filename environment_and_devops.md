# Environment and DevOps

Orbiter utilizes 100% free-tier cloud tooling, keeping operational overhead at $0 while demonstrating a production-ready, fault-tolerant infrastructure design.

## Deployed Infrastructure

1. **Backend & AI Engine (Koyeb)**
   - Deploys the Fast API + Uvicorn server (`python:3.11-slim`).
   - Handles real-time webhooks, ML inference, LangChain agent pipelines, and APScheduler routines.
   - Attached **1GB persistent disk** exclusively mapped for ChromaDB vectors (`/app/chroma_db`).
   - Ensures continuous uptime / "never sleeps".

2. **Frontend UI (Vercel)**
   - Next.js 14 App Router deployment.
   - Vercel Edge network powers `middleware.ts` execution, yielding zero-latency authentication checks completely isolated from the main servers.

3. **Database & Auth (Supabase)**
   - Primary PostgreSQL datastore for schema components (actions, repos, events).
   - Identity Provider via Supabase Auth (Google OAuth + Email magic links).

4. **Cache & Rate Limiting (Upstash Redis)**
   - Protects GitHub App Installation constraints.
   - Generates and securely caches GitHub installation scoped application tokens (TTL: 55 min) to optimize throughput.

5. **Email Delivery (Resend)**
   - Free tier usage for sending daily health digests.

## Environment Config
Never committed to source control. Configured on Koyeb and Vercel individually.

```env
# GitHub App Authentication
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# LLM Providers
GEMINI_API_KEY=
GROQ_API_KEY=

# Vendor Integrations
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
RESEND_API_KEY=

# Project Setup
JWT_SECRET_KEY=
FRONTEND_URL=https://orbiter.vercel.app
CHROMA_PERSIST_DIR=/app/chroma_db
ENVIRONMENT=production
```

## Setup via GitHub Settings
Installing Orbiter requires:
1. Registering the app at `github.com/settings/apps/new`.
2. Setting the webhook endpoint to `https://your-app.koyeb.app/webhooks/github`.
3. Validating required scopes on `issues`, `pull_requests`, `contents`, `commits`.
