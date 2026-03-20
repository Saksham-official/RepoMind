# Monorepo Structure

RepoMind is organized as a single repository containing the backend, frontend, and offline ML training utilities.

```
repomind/
├── backend/
│   ├── main.py                    # Entry point; sets up FastAPI and APScheduler
│   ├── requirements.txt           # Python dependency list
│   ├── .env.example               # Template for environment variables
│   │
│   ├── api/v1/
│   │   ├── auth.py                # JWT + Google OAuth routes
│   │   ├── repos.py               # Repository endpoints + manual reindex
│   │   ├── commits.py             # Fetching commit history
│   │   ├── agent.py               # Explicit manual trigger options
│   │   └── ws.py                  # WebSocket connection manager
│   │
│   ├── core/
│   │   ├── config.py              # Environment configuration management
│   │   ├── security.py            # Route dependencies for auth
│   │   │
│   │   ├── ml/
│   │   │   ├── classifier.py      # Random Forest scikit-learn .pkl integration
│   │   │   └── features.py        # Text vectorization and feature extraction
│   │   │
│   │   ├── agent/
│   │   │   ├── pipeline.py        # LangChain setup (ReAct)
│   │   │   ├── tools.py           # Custom LangChain Tools for GitHub/Chroma
│   │   │   └── prompts.py         # Base LLM Context
│   │   │
│   │   └── rag/
│   │       ├── indexer.py         # Parsing / Chunking / Embedding code
│   │       └── retriever.py       # Query execution for ChromaDB
│   │
│   ├── services/
│   │   ├── github.py              # PyGithub API abstraction
│   │   ├── scheduler.py           # Background monitoring loop (APScheduler)
│   │   ├── email.py               # Sending Resend digests
│   │   └── cache.py               # Upstash Redis wrapper
│   │
│   ├── db/
│   │   └── supabase.py            # Postgres/Auth Supabase Client API
│   │
│   ├── models/
│   │   └── schemas.py             # Pydantic schemas
│   │
│   ├── ml_training/               # Scripts to train ML offline
│   │   ├── collect_data.py        # GitHub Archive ingestion
│   │   ├── train.py               # Train and evaluate .pkl classifier
│   │   └── commit_classifier.pkl  # Resultant trained artifact
│   │
│   └── Dockerfile                 # Image build definition for Koyeb deployment
│
├── frontend/
│   ├── middleware.ts              # Next.js Edge Runtime Route Protection
│   ├── app/
│   │   ├── layout.tsx             # Global layout (Next.js App Router)
│   │   ├── page.tsx               # Public landing
│   │   ├── login/page.tsx         # Authentication
│   │   ├── dashboard/page.tsx     # Monitored repositories list
│   │   ├── repo/[id]/page.tsx     # Single repo dashboard & logs
│   │   └── settings/page.tsx      # Email notifications configuration
│   │
│   ├── components/
│   │   ├── ui/                    # Shadcn component primitives
│   │   ├── CommitCard.tsx         # Details for single commit log
│   │   ├── RepoHealthScore.tsx    # SVG GSAP animated visualization
│   │   ├── ActivityFeed.tsx       # WebSocket UI client
│   │   ├── TypeBadge.tsx          # UI element for classification tagging
│   │   ├── ReindexButton.tsx      # CTA for triggering repo-wise full refresh
│   │   └── TerminalLoader.tsx     # Indexing progress feedback animation
│   │
│   └── lib/
│       ├── api.ts                 # Fetch wrappers
│       ├── websocket.ts           # WS connection hook logic
│       └── supabase.ts            # Client-side Supabase adapter
│
└── README.md
```
