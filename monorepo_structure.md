# Monorepo Structure

Orbiter is organized as a single repository containing the backend, frontend, and offline ML training utilities.

```
orbiter/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── api/v1/
│   │   ├── auth.py              # JWT + Google OAuth via Supabase
│   │   ├── repos.py             # Add/remove repos, reindex trigger
│   │   ├── commits.py           # Commit history + analysis
│   │   ├── issues.py            # Issue triage log
│   │   ├── actions.py           # AI action audit trail
│   │   └── ws.py                # WebSocket live feed
│   │
│   ├── webhooks/
│   │   ├── handler.py           # POST /webhooks/github (entry point)
│   │   ├── security.py          # HMAC-SHA256 signature verification
│   │   └── router.py            # Route event type → pipeline
│   │
│   ├── pipelines/
│   │   ├── issue_triage.py      # Issue → classify → label → comment
│   │   ├── contributor_help.py  # Question → RAG → answer
│   │   └── commit_intel.py      # Commit → classify → analyze → score
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py          # JWT validation dependency
│   │   ├── ml/
│   │   │   ├── classifier.py    # Load .pkl, classify text
│   │   │   └── features.py      # Feature extraction
│   │   ├── agent/
│   │   │   ├── pipeline.py      # LangChain agent orchestration
│   │   │   └── tools.py         # search_codebase, git_blame, post_comment etc.
│   │   └── rag/
│   │       ├── indexer.py       # Codebase + docs + issues → ChromaDB
│   │       └── retriever.py     # Multi-collection semantic search
│   │
│   ├── services/
│   │   ├── github_app.py        # GitHub App auth + installation tokens
│   │   ├── scheduler.py         # APScheduler jobs
│   │   ├── email.py             # Resend digests
│   │   ├── cache.py             # Upstash Redis
│   │   └── websocket_manager.py # WebSocket connection manager
│   │
│   ├── db/
│   │   └── supabase.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   ├── ml_training/
│   │   ├── collect_data.py      # GitHub Archive + labeled issues dataset
│   │   ├── train.py             # Train unified classifier
│   │   └── classifier.pkl       # Committed after training
│   │
│   └── Dockerfile
│
├── frontend/
│   ├── middleware.ts             # Auth guard — runs at Vercel Edge
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing (public)
│   │   ├── login/page.tsx       # Login (public)
│   │   ├── dashboard/page.tsx   # Repo overview (protected)
│   │   ├── repo/[id]/
│   │   │   ├── page.tsx         # Repo detail (protected)
│   │   │   ├── issues/page.tsx  # Issue triage log
│   │   │   └── commits/page.tsx # Commit timeline
│   │   └── settings/page.tsx    # Webhook config (protected)
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── ActionCard.tsx        # AI action with reasoning expandable
│   │   ├── CommitCard.tsx        # Commit with ML badge
│   │   ├── IssueTriageCard.tsx   # Issue with classification + actions taken
│   │   ├── RepoHealthScore.tsx   # GSAP radial score
│   │   ├── ActivityFeed.tsx      # Live WebSocket feed
│   │   ├── ReindexButton.tsx     # Manual reindex with progress
│   │   └── TypeBadge.tsx         # bug/feature/question/breaking badges
│   │
│   └── lib/
│       ├── api.ts
│       ├── websocket.ts
│       └── supabase.ts
│
└── README.md
```
