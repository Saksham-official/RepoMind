# Architecture Document
## RepoMind — System Architecture
**Version:** 1.0 | **Date:** March 2026

---

## 1. Architecture Style

**Event-driven agent monolith.** Structured as a monolith for MVP speed, but cleanly separated into modules that can split into microservices at scale. A background scheduler drives everything — it detects events, triggers the agent, and the agent autonomously decides what to do using tools.

---

## 2. Full System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND — Vercel                            │
│         Next.js 14 · Framer Motion · GSAP · Magic UI            │
│                                                                  │
│  /dashboard     /repo/[id]     /activity     /settings          │
│  Add repos      Commit feed    Agent logs    Email prefs         │
└───────────────────────────┬──────────────────────────────────────┘
                            │ REST + WebSocket
┌───────────────────────────▼──────────────────────────────────────┐
│                    FASTAPI BACKEND — Koyeb                       │
│                                                                  │
│   Auth Middleware → JWT validation (Supabase)                    │
│   Rate Limiter   → Upstash Redis                                 │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  REST API   │  │  WebSocket   │  │  APScheduler         │   │
│  │  /repos     │  │  /ws/feed    │  │  Every 30 mins       │   │
│  │  /commits   │  │  live push   │  │  polls GitHub API    │   │
│  │  /agent     │  │              │  │  triggers pipeline   │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         └────────────────┴──────────────────────┘               │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │                   AGENT PIPELINE                           │  │
│  │                                                            │  │
│  │  1. ML Classifier (.pkl)                                   │  │
│  │     commit message + diff → type + confidence             │  │
│  │                                                            │  │
│  │  2. LangChain ReAct Agent                                  │  │
│  │     Thinks → Calls Tool → Observes → Repeats              │  │
│  │                                                            │  │
│  │     Tools:                                                 │  │
│  │     ├── get_commit_diff      (GitHub API)                  │  │
│  │     ├── search_codebase      (ChromaDB semantic search)    │  │
│  │     ├── find_related_issues  (GitHub API + embeddings)     │  │
│  │     ├── analyze_impact       (RAG over repo index)         │  │
│  │     └── post_github_comment  (GitHub API write)            │  │
│  │                                                            │  │
│  │  3. Response Structuring                                   │  │
│  │     → Save to Supabase                                     │  │
│  │     → Push to WebSocket                                    │  │
│  │     → Trigger email if breaking change                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────────┐
       │                    │                        │
┌──────▼──────────┐  ┌──────▼──────────┐  ┌─────────▼──────────┐
│    Supabase     │  │    ChromaDB     │  │   External APIs    │
│                 │  │                 │  │                    │
│  Postgres DB    │  │  repo_code      │  │  GitHub API v3     │
│  Auth (JWT)     │  │  collection     │  │  Gemini 1.5 Flash  │
│  Storage        │  │                 │  │  Groq (fallback)   │
│  RLS policies   │  │  commit_history │  │  Resend email      │
│                 │  │  collection     │  │  Upstash Redis     │
└─────────────────┘  └─────────────────┘  └────────────────────┘
```

---

## 3. Agent Pipeline — Detailed Flow

```
New commit detected by scheduler
            │
            ▼
┌─────────────────────────────────┐
│      ML Classifier              │
│                                 │
│  Input:                         │
│    commit.message               │
│    diff.stats (lines +/-)       │
│    files_changed list           │
│                                 │
│  Output:                        │
│    type: "bug_fix"              │
│    confidence: 0.91             │
│    is_breaking: false           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     LangChain ReAct Agent       │
│                                 │
│  THINK: "This is a bug fix      │
│  with 0.91 confidence. I need   │
│  to understand what was broken  │
│  and if any issues track this." │
│                                 │
│  ACT: get_commit_diff(sha)      │
│  OBSERVE: [diff returned]       │
│                                 │
│  THINK: "Diff touches auth.py   │
│  and middleware. Let me find    │
│  related open issues."          │
│                                 │
│  ACT: find_related_issues(      │
│    keywords=["auth", "token"])  │
│  OBSERVE: [Issue #234 matches]  │
│                                 │
│  THINK: "Issue #234 reports the │
│  same auth bug. This commit     │
│  likely resolves it. I should   │
│  post a comment."               │
│                                 │
│  ACT: post_github_comment(      │
│    issue=234, body="...")       │
│  OBSERVE: [comment posted]      │
│                                 │
│  THINK: "Done. Summarize."      │
└──────────────┬──────────────────┘
               │
               ▼
    Structured result saved
    WebSocket pushed to UI
    Email triggered if breaking
```

---

## 4. RAG & Embedding Design

### Codebase Indexing
```
GitHub repo cloned/fetched
          │
          ▼
Parse code files (Python, JS, TS, etc.)
  → Skip: node_modules, .git, binaries
          │
          ▼
Chunk strategy:
  → Function-level splitting (ast.parse for Python)
  → RecursiveCharacterTextSplitter fallback
  → chunk_size=800, overlap=150
          │
          ▼
Embed with: BAAI/bge-base-en-v1.5
  → Local, free, 768 dimensions, excellent quality
          │
          ▼
Store in ChromaDB:
  collection: "repo_{repo_id}_code"
  metadata: {
    file_path, function_name,
    language, last_modified,
    commit_sha_when_indexed
  }
```

### Incremental Re-indexing
On new commits, only re-embed files that appear in the commit diff. 
Not the entire repo — just changed files. Fast and cheap.

### Commit History Embedding
Every commit message + summary also embedded separately.
Collection: `"repo_{repo_id}_commits"`
Enables: "When was rate limiting added?" style queries.

---

## 5. ML Model Architecture

```
RAW DATA (GitHub Archive)
50,000 labeled commits
          │
          ▼
Feature Engineering:
  X1: TF-IDF(commit_message)      → sparse matrix
  X2: diff_lines_added            → int
  X3: diff_lines_removed          → int  
  X4: num_files_changed           → int
  X5: has_breaking_keyword        → bool (BREAKING, deprecated)
  X6: file_type_distribution      → {py: 0.6, md: 0.4}
          │
          ▼
Handle class imbalance:
  SMOTE oversampling on minority classes
  (breaking_change, test are rare)
          │
          ▼
Model: Pipeline([
  TfidfVectorizer(ngram_range=(1,2)),
  FeatureUnion([tfidf, numeric_features]),
  RandomForestClassifier(n_estimators=200)
])
          │
          ▼
Evaluation:
  Accuracy: ~88%
  F1 (macro): ~0.85
  Confusion matrix saved as artifact
          │
          ▼
Serialize: joblib.dump(model, "commit_classifier.pkl")
Serve: FastAPI POST /api/v1/classify
```

---

## 6. Database Schema

```sql
-- Monitored repositories
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  github_url TEXT NOT NULL,
  owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  is_indexed BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  health_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed commits
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id),
  sha TEXT NOT NULL,
  message TEXT,
  author TEXT,
  committed_at TIMESTAMPTZ,
  commit_type TEXT,           -- ML classification result
  confidence FLOAT,
  is_breaking BOOLEAN DEFAULT false,
  agent_analysis TEXT,        -- LLM agent summary
  related_issues JSONB,       -- [{number, title, url}]
  comment_posted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity log
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id),
  event_type TEXT,            -- 'commit_analyzed', 'issue_linked', 'comment_posted'
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences  
CREATE TABLE notification_settings (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  email_frequency TEXT DEFAULT 'daily',  -- 'immediate', 'daily', 'weekly', 'off'
  alert_on_breaking BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. WebSocket Design

```
Client connects: ws://api/ws/feed?token={jwt}
          │
Backend validates JWT
          │
Client subscribed to their repos' events
          │
On any agent event:
  Backend pushes JSON:
  {
    "type": "commit_analyzed",
    "repo": "fastapi/fastapi",
    "data": {
      "sha": "abc123",
      "commit_type": "bug_fix",
      "confidence": 0.91,
      "summary": "Fixed null pointer in auth middleware",
      "related_issues": [234],
      "is_breaking": false
    }
  }
          │
Frontend: activity feed updates live
          No polling. Pure push.
```

---

## 8. Deployment Architecture

```
GitHub (main branch push)
          │
          ├── GitHub Actions CI
          │     run tests → if pass → trigger deploys
          │
          ├── Vercel (Frontend — auto deploy)
          │     Next.js build
          │     Edge CDN globally
          │
          └── Koyeb (Backend — auto deploy)
                FastAPI + Uvicorn
                Persistent disk for ChromaDB
                All env vars in Koyeb dashboard

External services (zero-config):
  Supabase  → DB + Auth + Storage
  Upstash   → Redis cache + rate limiting
  Resend    → Email digests
  UptimeRobot → Pings /health every 5 mins
```

---

## 9. Security

| Threat | Mitigation |
|---|---|
| Unauthorized access | JWT + Supabase RLS on all tables |
| GitHub token exposure | Stored encrypted in Supabase, never in responses |
| Prompt injection via commit messages | Input sanitized before agent context |
| Rate limit abuse | Upstash Redis per-user counters |
| API key leakage | Env vars only, never in code |

---

## 10. Scalability Path

**0–1k users:** Monolith on Koyeb free, ChromaDB on disk. Cost: ₹0.

**1k–10k users:** Add Koyeb paid ($5/mo), Pinecone starter, Supabase Pro. Cost: ~$40/mo.

**10k+ users:** Split agent pipeline into separate worker, add job queue (Redis), horizontal scaling. Cost: ~$150/mo.

---

*Architecture v2.0 — RepoMind*
