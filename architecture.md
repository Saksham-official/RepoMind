# Architecture Document
## Orbiter — System Architecture
**Version:** 1.0 | **Date:** March 2026

---

## 1. Architecture Style

**Event-driven webhook monolith.** GitHub App delivers events in real time via webhooks. FastAPI routes each event type to a dedicated pipeline. Pipelines run as background tasks (FastAPI BackgroundTasks — free, in-process). ChromaDB provides semantic memory. APScheduler handles periodic jobs (polling fallback, stale issue checker, email digests). Everything on free cloud tiers.

---

## 2. Full System Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        GITHUB                                       │
│   Issues · PRs · Pushes · Releases · Comments                      │
└──────────────────────────┬─────────────────────────────────────────┘
                           │  HTTPS Webhook POST (real-time)
                           │  X-Hub-Signature-256: HMAC verified
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND — Koyeb                          │
│                                                                     │
│  POST /webhooks/github                                              │
│    → verify HMAC signature                                          │
│    → parse event type                                               │
│    → ACK 200 immediately (GitHub needs < 10s response)             │
│    → dispatch to BackgroundTask                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   EVENT ROUTER                                │  │
│  │                                                               │  │
│  │  issues.opened      → IssueTriage Pipeline                   │  │
│  │  issues.opened      → ContributorHelper (if question)        │  │
│  │  pull_request.opened→ PRReview Pipeline (Phase 2)            │  │
│  │  push               → CommitIntelligence Pipeline (v1)       │  │
│  │  release.created    → ReleaseAssistant Pipeline (Phase 2)    │  │
│  │  issue_comment      → MentionResponder (Phase 2)             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼──────────────────────────────────────┐ │
│  │                  PIPELINE LAYER                                │ │
│  │                                                                │ │
│  │  IssueTriage:                                                  │ │
│  │    1. ML classify (bug/feature/question/duplicate)             │ │
│  │    2. Embed issue → search ChromaDB for duplicates            │ │
│  │    3. Git blame → suggest owner                               │ │
│  │    4. LangChain agent → decide actions                        │ │
│  │    5. GitHub API → apply labels + post comment                │ │
│  │                                                                │ │
│  │  ContributorHelper:                                            │ │
│  │    1. RAG over docs/ + CONTRIBUTING.md + past issues          │ │
│  │    2. LLM synthesize answer                                   │ │
│  │    3. GitHub API → post answer comment                        │ │
│  │    4. If docs gap found → open new issue                      │ │
│  │                                                                │ │
│  │  CommitIntelligence (v1):                                      │ │
│  │    1. ML classify commit type                                  │ │
│  │    2. Agent analyze impact via RAG                            │ │
│  │    3. Update health score                                      │ │
│  │    4. WebSocket push to dashboard                             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                           │                                         │
│  ┌────────────────────────▼──────────────────────────────────────┐ │
│  │                   CORE AI LAYER                                │ │
│  │                                                                │ │
│  │  ML Classifier (.pkl)   LangChain ReAct Agent                 │ │
│  │  TF-IDF + RandomForest  Tools: search_codebase,              │ │
│  │  Issues + Commits       get_issue_diff, find_similar,        │ │
│  │  < 10ms inference       git_blame, post_comment              │ │
│  └──────────┬─────────────────────────┬──────────────────────────┘ │
│             │                         │                             │
│    ┌────────▼────────┐      ┌─────────▼──────────┐                │
│    │    ChromaDB     │      │   LLM Router        │                │
│    │    Vector Store │      │   Gemini Flash (1°) │                │
│    │    code chunks  │      │   Groq Llama (2°)   │                │
│    │    issue embeds │      │   Free tiers only   │                │
│    │    doc chunks   │      └─────────────────────┘                │
│    └─────────────────┘                                              │
│                                                                     │
│  APScheduler (in-process, always-on):                              │
│    → Commit polling fallback (30 min)                              │
│    → Stale issue checker (daily)                                   │
│    → Email digest sender (daily)                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                      │
┌───────▼───────┐  ┌───────▼───────┐  ┌──────────▼──────────┐
│   Supabase    │  │   Upstash     │  │   External          │
│   Postgres    │  │   Redis       │  │   GitHub API v3     │
│   Auth (JWT)  │  │   Cache       │  │   Resend Email      │
│   Storage     │  │   Rate limit  │  │   Gemini + Groq     │
└───────────────┘  └───────────────┘  └─────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    FRONTEND — Vercel                                │
│         Next.js 14 · Framer Motion · GSAP · Magic UI              │
│         middleware.ts protects all routes at Edge level            │
│                                                                     │
│  /dashboard    Repo overview, health scores, action feed           │
│  /repo/[id]    Commit timeline, issue triage log, AI actions       │
│  /settings     Webhook config, notification prefs                  │
│  /login        Google OAuth only public route                      │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. GitHub App Architecture

This is the core of what makes Orbiter production-grade vs a basic bot.

```
GITHUB APP vs PERSONAL ACCESS TOKEN:

PAT (old approach):              GitHub App (Orbiter):
────────────────────             ────────────────────────────
Tied to your account             Independent identity ("Orbiter Bot")
Rate limit: 5k/hr total          Rate limit: 5k/hr PER INSTALLATION
Polling required                 Webhooks — real-time push
Manual secret management         Auto-rotating installation tokens
Can't verify webhook source      HMAC signature on every webhook
                                 Fine-grained per-repo permissions

GITHUB APP SETUP:
1. Register at github.com/settings/apps/new
2. Set webhook URL: https://your-app.koyeb.app/webhooks/github
3. Set webhook secret → store in GITHUB_WEBHOOK_SECRET env var
4. Subscribe to events: issues, pull_request, push, release
5. Set permissions: issues (write), PRs (write), contents (read)
6. Generate private key → store as GITHUB_APP_PRIVATE_KEY env var
7. Note App ID → store as GITHUB_APP_ID env var

WEBHOOK FLOW:
GitHub event occurs
    → GitHub signs payload: HMAC-SHA256(payload, webhook_secret)
    → Sends POST to /webhooks/github with X-Hub-Signature-256 header
    → Orbiter verifies signature before processing anything
    → ACK 200 immediately
    → Process in background

INSTALLATION TOKEN FLOW (per-repo auth):
Each repo that installs the app gets an installation_id.
To act on that repo:
    1. Sign JWT using GitHub App private key
    2. POST /app/installations/{id}/access_tokens
    3. Get short-lived token (1 hour)
    4. Use token for all GitHub API calls on that repo
    5. Cache token in Redis (TTL: 55 min)
```

---

## 4. Issue Triage Pipeline — Deep Dive

```
Webhook: issues.opened
            │
            ▼
┌───────────────────────────────────────┐
│  Step 1: ML Classification            │
│                                       │
│  Input: title + body                  │
│  Model: TF-IDF + RandomForest (.pkl)  │
│  Output: {                            │
│    type: "bug",                       │
│    confidence: 0.94,                  │
│    scores: {bug:0.94, feat:0.04,      │
│             question:0.02}            │
│  }                                    │
│  Time: ~8ms (local, no API)           │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│  Step 2: Duplicate Detection          │
│                                       │
│  Embed issue text (bge-base local)    │
│  Search ChromaDB: collection          │
│    "repo_{id}_issues"                 │
│  Threshold: similarity > 0.88         │
│                                       │
│  Hit → {issue_number: 198,            │
│          similarity: 0.91,            │
│          title: "crash large file"}   │
│  Miss → continue                      │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│  Step 3: Owner Suggestion             │
│                                       │
│  Extract keywords from issue body     │
│  Search codebase embeddings:          │
│    "which files relate to this?"      │
│  For each related file: git log       │
│    → most frequent committer          │
│  Score contributors by:               │
│    recency × frequency × file_match   │
│  Output: suggested_owner = "@alice"   │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│  Step 4: LangChain Agent Decides      │
│                                       │
│  Agent reads: classification,         │
│  duplicate_result, owner_suggestion,  │
│  issue content                        │
│                                       │
│  Agent decides:                       │
│  IF duplicate found:                  │
│    → post_comment(ref original)       │
│    → add_label("duplicate")           │
│  ELSE IF type == "bug":               │
│    → add_labels(["bug","needs-repro"])│
│    → post_comment(ask for steps)      │
│    → suggest_assignee(owner)          │
│  ELSE IF type == "feature":           │
│    → add_label("enhancement")         │
│    → post_comment(acknowledge)        │
│  ELSE IF type == "question":          │
│    → route to ContributorHelper       │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│  Step 5: GitHub Actions               │
│                                       │
│  GitHub API (installation token):     │
│  PATCH /issues/{n}/labels             │
│  POST  /issues/{n}/comments           │
│  POST  /issues/{n}/assignees          │
│                                       │
│  Save to Supabase: ai_actions table   │
│  WebSocket push → dashboard feed      │
│  Total time: < 12 seconds             │
└───────────────────────────────────────┘
```

---

## 5. Contributor Helper Pipeline

```
Issue classified as "question"
            │
            ▼
RAG Query Construction:
  Extract: what is being asked?
  Build query: "how to {extracted_intent} in this repo"
            │
            ▼
Multi-collection RAG search:
  Search "repo_{id}_docs":       CONTRIBUTING.md, README, docs/
  Search "repo_{id}_issues":     Past resolved questions
  Search "repo_{id}_code":       Relevant code examples
  Top-5 chunks from each → 15 total candidates
  Cross-encoder reranking → top-6 final
            │
            ▼
LLM Generation:
  System: "You are a helpful maintainer.
  Answer based ONLY on the provided context.
  Be specific. Reference exact file names.
  If context is insufficient, say so honestly."

  Context: [6 ranked chunks with sources]
  Query: [the question]
            │
            ▼
Gap Detection:
  "Was this question answerable from existing docs?"
  If confidence < 0.6: open new issue
    "docs: {question} not covered in CONTRIBUTING.md"
            │
            ▼
Post answer as GitHub comment
  → Cites sources: "Based on CONTRIBUTING.md line 47..."
  → Adds label: "question" + "answered"
```

---

## 6. Database Schema

```sql
-- Installed GitHub repos
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  installation_id BIGINT NOT NULL,   -- GitHub App installation
  github_repo_id BIGINT NOT NULL,
  owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  is_indexed BOOLEAN DEFAULT false,
  last_indexed_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  health_score INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- All AI actions taken (full audit trail)
CREATE TABLE ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id),
  event_type TEXT NOT NULL,         -- 'issue_triage', 'contributor_help', 'commit_analysis'
  github_event_id TEXT,             -- GitHub's delivery ID (idempotency)
  target_type TEXT,                 -- 'issue', 'pr', 'commit'
  target_number INT,                -- Issue/PR number
  actions_taken JSONB,              -- [{action: 'add_label', value: 'bug'}]
  reasoning TEXT,                   -- Agent's explanation
  ml_classification JSONB,          -- {type, confidence, scores}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed commits (from v1)
CREATE TABLE commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id),
  sha TEXT NOT NULL,
  message TEXT,
  author TEXT,
  committed_at TIMESTAMPTZ,
  commit_type TEXT,
  confidence FLOAT,
  is_breaking BOOLEAN DEFAULT false,
  agent_analysis TEXT,
  related_issues JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Processed issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES repositories(id),
  github_issue_id BIGINT NOT NULL,
  number INT NOT NULL,
  title TEXT,
  body TEXT,
  classified_type TEXT,
  confidence FLOAT,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of INT,
  suggested_owner TEXT,
  orbiter_responded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook event log (idempotency + debugging)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT UNIQUE NOT NULL,  -- GitHub's X-GitHub-Delivery header
  event_type TEXT NOT NULL,
  repo_full_name TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences
CREATE TABLE notification_settings (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  email_frequency TEXT DEFAULT 'daily',
  alert_on_breaking BOOLEAN DEFAULT true,
  alert_on_duplicate_issue BOOLEAN DEFAULT true
);
```

---

## 7. ChromaDB Collections Per Repo

```
repo_{id}_code
  Source: all code files (Python, JS, TS, etc.)
  Chunks: function-level, 800 tokens, 150 overlap
  Metadata: file_path, function_name, language, commit_sha
  Updated: incremental on push events

repo_{id}_docs
  Source: README.md, CONTRIBUTING.md, docs/, wiki
  Chunks: section-level, 600 tokens, 100 overlap
  Metadata: file_path, section_heading, last_modified
  Updated: on push events touching doc files

repo_{id}_issues
  Source: all closed/resolved GitHub issues
  Chunks: full issue (title + body + resolution comment)
  Metadata: issue_number, type, resolution, closed_at
  Updated: daily batch + on issue.closed event

repo_{id}_commits
  Source: commit messages + file list summaries
  Chunks: per-commit
  Metadata: sha, author, type, date
  Updated: append-only on push
```

---

## 8. Caching Strategy (Upstash Redis)

```
github_token:{installation_id}     TTL: 55min  (installation access token)
classify:{md5(text)}               TTL: 7d     (ML classification result)
embed:{md5(text)}                  TTL: 30d    (embedding vector)
issues_list:{owner}_{repo}         TTL: 15min  (GitHub issues list)
blame:{owner}_{repo}_{filepath}    TTL: 1hr    (git blame result)
rate:{user_id}:{date}              TTL: 24hr   (free tier rate limiting)
```

---

## 9. Webhook Security

```python
import hmac, hashlib

def verify_github_webhook(payload_bytes: bytes, signature_header: str,
                          secret: str) -> bool:
    """
    Every webhook must be verified before processing.
    Prevents anyone from spoofing GitHub events to your endpoint.
    """
    if not signature_header or not signature_header.startswith("sha256="):
        return False

    expected = hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()

    received = signature_header[len("sha256="):]

    # Constant-time comparison (prevents timing attacks)
    return hmac.compare_digest(expected, received)
```

---

## 10. Deployment Architecture

```
GitHub push to main
        │
        ▼
GitHub Actions CI
  → Run tests
  → If pass → trigger deploys
        │
        ├── Vercel (Frontend)
        │     Next.js build + Edge deployment
        │     middleware.ts enforces auth at Edge
        │     Global CDN, auto HTTPS
        │
        └── Koyeb (Backend)
              FastAPI + Uvicorn
              Persistent disk /app/chroma_db
              APScheduler in-process (always-on)
              All env vars in Koyeb dashboard

Webhook URL registered in GitHub App:
  https://your-app.koyeb.app/webhooks/github

External services:
  Supabase   → DB + Auth + Storage (free 500MB)
  Upstash    → Redis cache (free 10k/day)
  Resend     → Email (free 3k/month)
  UptimeRobot→ Pings /health every 5 min
  is-a.dev   → Free subdomain
```

---

## 11. Scalability Path

```
0 → 100 repos:   Single Koyeb free instance, ChromaDB disk. Cost: ₹0
100 → 500 repos: Koyeb paid ($5/mo), Supabase Pro ($25/mo). Cost: ~$30/mo
500+ repos:      Split webhook handler + pipeline workers. Redis job queue.
```

---

*Architecture v1.0 — Orbiter*
