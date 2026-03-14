# System Design Document
## RepoMind — Complete System Design
**Version:** 1.0 | **Date:** March 2026

---

## 1. System Overview

RepoMind is an event-driven AI system. A scheduler detects GitHub events, triggers a multi-step AI pipeline (ML classification → LangChain agent → RAG retrieval → action), and delivers results to a live dashboard and email. Designed as a clean monolith — fast to build, zero ops overhead, scales when needed.

---

## 2. Request Lifecycle — Adding a Repo

```
User pastes: github.com/tiangolo/fastapi
        │
        ▼
POST /api/v1/repos/
  → Validate GitHub URL (exists + public)
  → Save to Supabase repositories table (is_indexed: false)
  → Return repo_id + trigger background indexing job
        │
        ▼
Background: index_repository(repo_id)
  → GitHub API: fetch all file contents
  → Filter: only code files, skip > 100KB
  → Chunk with RecursiveCharacterTextSplitter
  → Embed with BAAI/bge-base-en-v1.5 (local)
  → Upsert to ChromaDB collection: repo_{id}_code
  → Progress pushed via WebSocket to frontend
  → On complete: update is_indexed: true, last_checked_at: now()
        │
        ▼
Frontend: progress bar animates → "✓ Indexed 847 files"
Repo now active in scheduler's poll list
```

---

## 3. Request Lifecycle — Commit Analysis

```
APScheduler fires (every 30 mins)
        │
        ▼
For each is_indexed repo:
  GitHub API: GET /repos/{owner}/{repo}/commits?since={last_checked}
        │
        ├── 0 new commits → update last_checked_at, continue
        │
        └── N new commits → for each:
                │
                ▼
        ┌───────────────────────────────────┐
        │       ML CLASSIFIER               │
        │                                   │
        │  Input: message + diff stats      │
        │  Transform: TF-IDF + numeric      │
        │  Predict: RandomForest.pkl        │
        │  Output:                          │
        │    type: "bug_fix"                │
        │    confidence: 0.91              │
        │    is_breaking: false             │
        │  Time: ~5ms (local, no API)       │
        └──────────────┬────────────────────┘
                       │
                       ▼
        ┌───────────────────────────────────┐
        │       LANGCHAIN REACT AGENT       │
        │                                   │
        │  Input: commit info + ML result   │
        │                                   │
        │  Loop (max 6 iterations):         │
        │                                   │
        │  ITER 1:                          │
        │    Think: "Need the diff"         │
        │    Act: get_commit_diff(sha)      │
        │    Observe: [code changes]        │
        │                                   │
        │  ITER 2:                          │
        │    Think: "Touch auth module,     │
        │    search codebase for context"   │
        │    Act: search_codebase(          │
        │      "authentication middleware") │
        │    Observe: [auth.py chunks]      │
        │                                   │
        │  ITER 3:                          │
        │    Think: "Find related issues"   │
        │    Act: find_related_issues(      │
        │      ["auth", "token", "null"])   │
        │    Observe: Issue #234 matches    │
        │                                   │
        │  ITER 4:                          │
        │    Think: "Strong match. Post."   │
        │    Act: post_github_comment(234)  │
        │    Observe: Comment posted ✓      │
        │                                   │
        │  Final: Structured summary        │
        └──────────────┬────────────────────┘
                       │
                       ▼
        Save to Supabase commits table
        Push event to WebSocket connections
        If is_breaking → send email immediately
        Update repo health score
```

---

## 4. Data Flow Diagram

```
┌──────────┐    poll     ┌──────────────┐   fetch   ┌─────────────┐
│Scheduler │────────────▶│  GitHub API  │◀──────────│  Tools      │
└──────────┘             └──────┬───────┘           └─────────────┘
                                │ new commits
                                ▼
                         ┌──────────────┐
                         │ML Classifier │
                         │  (.pkl)      │
                         └──────┬───────┘
                                │ type + confidence
                                ▼
                         ┌──────────────┐   query   ┌─────────────┐
                         │  LangChain   │──────────▶│  ChromaDB   │
                         │  Agent       │◀──────────│  Vector DB  │
                         └──────┬───────┘   chunks  └─────────────┘
                                │                         ▲
                                │ context                 │ index
                                ▼                         │
                         ┌──────────────┐          ┌──────────────┐
                         │  Gemini/Groq │          │   Indexer    │
                         │  LLM API     │          │  (on add)    │
                         └──────┬───────┘          └──────────────┘
                                │ summary
                                ▼
                ┌───────────────┴────────────────┐
                │                                │
         ┌──────▼──────┐                  ┌──────▼──────┐
         │  Supabase   │                  │  WebSocket  │
         │  Postgres   │                  │  → Frontend │
         └──────┬──────┘                  └─────────────┘
                │ if breaking
                ▼
         ┌──────────────┐
         │    Resend    │
         │  Email Alert │
         └──────────────┘
```

---

## 5. ChromaDB Collection Design

```
Collection 1: repo_{id}_code
  Purpose: Semantic codebase understanding
  Chunks: Function-level code snippets
  Metadata: {file_path, function_name, language, commit_sha}
  Size: ~5k–50k chunks per repo
  Updated: On every new commit (changed files only)

Collection 2: repo_{id}_commits  
  Purpose: "When was X feature added?" queries
  Chunks: Commit message + file list summary
  Metadata: {sha, author, date, commit_type}
  Size: Full commit history
  Updated: Append-only per new commit

Query Strategy:
  search_type: "mmr"        (Max Marginal Relevance)
  k: 4                      (return 4 chunks)
  fetch_k: 20               (from top 20 candidates)
  Ensures: Diverse results, not 4 chunks from same function
```

---

## 6. WebSocket Design

```
Connection:
  Client → ws://api/ws/feed?token={jwt}
  Server validates JWT → subscribes to user's repos

Event Types pushed to client:
  {type: "indexing_progress", files_done: 42, current_file: "auth.py"}
  {type: "commit_analyzed", sha: "abc", commit_type: "bug_fix", confidence: 0.91}
  {type: "breaking_detected", sha: "xyz", summary: "..."}
  {type: "issue_linked", commit_sha: "abc", issue_number: 234}
  {type: "comment_posted", issue_number: 234, comment_url: "..."}

Frontend handles:
  → Activity feed appends new event (Framer Motion AnimatePresence)
  → Commit type badge appears on timeline
  → Breaking change banner animates in (red alert)
  → Health score recalculates + GSAP re-animates
```

---

## 7. ML Model — Design Decisions

### Why Random Forest, not deep learning?

| Factor | Random Forest | Fine-tuned BERT |
|---|---|---|
| Training time | 2–5 minutes | Hours (GPU needed) |
| Inference | ~5ms local | 200ms+ or API cost |
| Interpretability | Feature importance | Black box |
| Accuracy on commits | ~88% | ~93% |
| Deployment | `.pkl` file, zero deps | Model server needed |
| Interview story | Explain every decision | "I used a transformer" |

Random Forest wins for MVP. Add DistilBERT in Phase 2 when you need the extra 5%.

### Class Imbalance Handling
```
Raw dataset distribution (approximate):
  feat/feature:       35%  ← dominant
  fix/bug_fix:        28%
  docs:               15%
  refactor:           12%
  test:                6%  ← minority
  breaking_change:     4%  ← rare but critical

Fix: SMOTE oversampling on minority classes before training
Result: Balanced training set, better F1 on rare classes
This is exactly the kind of ML decision you discuss in interviews.
```

### Feature Engineering
```python
Features used:
  1. TF-IDF(message, ngram=(1,2), max_features=5000)
     "fix null pointer" → sparse vector
     Bigrams catch: "breaking change", "add feature"

  2. additions (int) — large additions = likely feature
  3. deletions (int) — large deletions = likely refactor
  4. files_changed (int) — many files = risky change
  5. has_breaking_keyword (bool) — explicit signal

Not used (intentionally):
  - Author name (bias risk)
  - Time of day (noise)
  - Repo-specific terms (generalization)
```

---

## 8. Caching Strategy

```
Upstash Redis (free 10k commands/day):

Key: "classify:{md5(message + str(additions))}"
TTL: 7 days
Why: Same commit message patterns repeat constantly
     "fix: typo" appears thousands of times
     Cache hit = 5ms instead of model inference

Key: "gh_issues:{owner}_{repo}_{page}"  
TTL: 15 minutes
Why: Issues list changes slowly, heavy to fetch repeatedly
     Saves GitHub API rate limit (5k/hour authenticated)

Key: "embed:{md5(text)}"
TTL: 30 days
Why: Same code chunks re-embedded = pure waste
     Embedding is the slowest local operation

Key: "rate:{user_id}:{date}"
TTL: 24 hours
Why: Enforce free tier limits (5 repos max)
     Upstash atomic increment = race-condition safe
```

---

## 9. GitHub API Rate Limit Management

```
Unauthenticated: 60 req/hour (don't use this)
Authenticated PAT: 5,000 req/hour

Our usage per poll cycle (30 mins, 10 repos):
  List commits since last check:  10 req (1 per repo)
  Fetch commit diffs:             ~30 req (3 commits avg)
  Search issues (agent tool):     ~20 req
  Post comments (rarely):         ~5 req
  Total per cycle:                ~65 req

At 30 min intervals: 130 req/hour
Well within 5,000/hour limit even with 20+ repos.

Safety: Cache issue lists (15 min TTL)
        Skip diff fetch if commit message is trivially "docs: typo"
        Exponential backoff on 429 responses
```

---

## 10. Repo Health Score Algorithm

```python
def calculate_health_score(repo_id: str, days: int = 30) -> int:
    """
    Score 0-100 based on recent commit patterns.
    Higher = healthier, more active, fewer breaking changes.
    """
    commits = get_recent_commits(repo_id, days)
    if not commits:
        return 50  # No data = neutral

    total = len(commits)
    breaking = sum(1 for c in commits if c["is_breaking"])
    bugs = sum(1 for c in commits if c["commit_type"] == "bug_fix")
    features = sum(1 for c in commits if c["commit_type"] == "feature")
    docs = sum(1 for c in commits if c["commit_type"] == "docs")

    # Component scores (each 0-1)
    activity_score = min(total / 20, 1.0)            # 20+ commits = full score
    breaking_penalty = 1.0 - min(breaking / total, 0.3)  # Cap penalty at 30%
    quality_score = 1.0 - min((bugs / total) * 0.5, 0.4) # Many bugs = lower
    maintenance_score = min((docs / total) * 3, 1.0)     # Docs = good sign

    score = (
        activity_score    * 0.30 +
        breaking_penalty  * 0.35 +  # Breaking changes weighted highest
        quality_score     * 0.25 +
        maintenance_score * 0.10
    ) * 100

    return round(score)
```

---

## 11. Email Digest Design

```
Trigger conditions:
  IMMEDIATE: is_breaking = true (never delay this)
  DAILY:     digest at 9am user's timezone (if has activity)
  WEEKLY:    Sunday summary (if daily off)

Daily digest structure:
  Subject: "RepoMind: fastapi/fastapi — 12 commits, 1 breaking ⚠"

  Body:
  📦 Repository Activity — March 6, 2026

  Breakdown:
    🔴 1 breaking change
    🐛 4 bug fixes
    ✨ 5 features
    📝 2 documentation

  ⚠ Breaking Change Alert:
    Commit abc1234: "BREAKING: remove deprecated v1 endpoints"
    Affected files: routers/v1/*, tests/v1/*
    Related issue: #892 (open)
    [View Analysis →]

  🔗 New Issue Connections:
    Commit def5678 → likely fixes Issue #234 (auth null pointer)
    [View on GitHub →]

  Repo Health: 72/100 (↓8 from last week)

  [Open Dashboard →]
```

---

## 12. Scalability Path

```
Now (0 → 500 users)
  Single Koyeb instance
  ChromaDB on persistent disk
  APScheduler in-process
  Supabase free tier
  Cost: $0/month

Growth (500 → 5k users)
  Koyeb paid ($5/mo)
  Supabase Pro ($25/mo)
  Migrate ChromaDB → Pinecone starter ($70/mo)
  Cost: ~$100/month
  Break-even: not relevant (portfolio project)

Scale (5k+ users — future)
  Split scheduler → dedicated worker dyno
  Redis queue (Bull/Celery) for agent jobs
  Pinecone scaled index
  Read replica for Supabase
  Cost: ~$300/month
```

---

## 13. Error Handling Strategy

```
GitHub API down:
  → Catch exception, log, skip this poll cycle
  → Retry next scheduled run (30 mins)
  → No crash, no user impact

LLM API failure (Gemini):
  → Automatic fallback to Groq
  → If both fail: save classification-only result
  → Agent summary = "LLM unavailable, classification only"
  → Always save ML result even if agent fails

ChromaDB corruption:
  → Re-index from GitHub (automated recovery endpoint)
  → POST /api/v1/repos/{id}/reindex

Agent infinite loop:
  → max_iterations=6 hard cap
  → Timeout: 30 seconds per agent run
  → If exceeded: save partial result

WebSocket disconnect:
  → Client auto-reconnects with exponential backoff
  → Missed events fetched via REST /api/v1/repos/{id}/activity
```

## 13. Auth Protection — Why Middleware Is The Right Approach

```
WRONG (what your previous project did):
  User visits /dashboard
        ↓
  Next.js sends full HTML + JS to browser
        ↓
  Browser renders dashboard (VISIBLE)
        ↓
  useEffect fires → checks auth → redirect
  Gap: page visible for 100-500ms, API calls may fire

CORRECT (middleware.ts):
  User visits /dashboard
        ↓
  Next.js Edge Runtime intercepts request (before any HTML sent)
        ↓
  middleware.ts checks Supabase session token
        ↓
  No session? → 302 redirect to /login
  Has session? → page renders normally
  Gap: zero — user never receives protected page HTML
```

Middleware runs at the CDN/Edge level on Vercel — faster than any server response and completely client-bypass-proof.

---

## 14. Always-On Tracking — How It Works When App Is Closed

```
User closes browser at 11pm
        │
        │  Nothing changes on backend
        ▼
Koyeb server (always running):
  APScheduler fires at 11:30pm
    → Polls GitHub for all monitored repos
    → Finds 3 new commits
    → Runs ML classifier on each
    → Triggers LangChain agent
    → Saves results to Supabase
    → Sends breaking change email if needed

APScheduler fires at 12:00am... 12:30am... 1:00am...
  (continues every 30 mins regardless)

User opens browser at 9am next day:
  Dashboard loads → fetches from Supabase
  → Shows all 8 commits analyzed overnight
  → Activity feed populated with agent actions
  → All happened while app was "closed"
```

The key insight: **the browser is a viewport, not the engine.** The engine (scheduler + agent) lives on Koyeb and never stops.

---

## 15. Manual Re-index — When and Why

```
Automatic indexing: happens once when repo is first added
Incremental updates: only changed files re-embedded on new commits

But sometimes you need a full re-index:
  ├── Major refactor: entire folder structure changed
  ├── Branch merge: thousands of new files added
  ├── Rename: files moved, old embeddings point to dead paths
  └── First index was interrupted: partial index = bad search results

Re-index flow:
  User clicks "Re-index" button
        ↓
  POST /api/v1/repos/{id}/reindex
        ↓
  Backend: mark is_indexed=false, invalidate Redis cache
        ↓
  Background task: clear ChromaDB collection for this repo
        ↓
  Re-fetch all files from GitHub API
        ↓
  Re-chunk, re-embed, re-store
        ↓
  Progress pushed via WebSocket → frontend shows live progress
        ↓
  Complete: is_indexed=true, last_indexed_at=now()
        ↓
  WebSocket: "✓ Re-indexed 847 files"

All this happens in background — user sees progress bar,
can still use the rest of the dashboard during re-index.
```

---

*System Design v2.0 — RepoMind*
