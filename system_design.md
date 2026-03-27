# System Design Document
## Orbiter — Complete System Design
**Version:** 1.0 | **Date:** March 2026

---

## 1. System Overview

Orbiter is a real-time event-driven AI system. GitHub App webhooks deliver events instantly. FastAPI ACKs immediately and dispatches to background pipelines. Pipelines combine ML classification, RAG retrieval, and LangChain agent reasoning to take autonomous actions back on GitHub. APScheduler handles periodic jobs. Dashboard shows a live audit trail via WebSocket.

---

## 2. Request Lifecycle — Issue Opened

```
Developer opens Issue #247: "App crashes on large file upload"
        │
        │ Milliseconds later
        ▼
GitHub signs payload with HMAC-SHA256
Sends POST to: https://orbiter.koyeb.app/webhooks/github
Headers:
  X-GitHub-Event: issues
  X-GitHub-Delivery: abc-123-delivery-id
  X-Hub-Signature-256: sha256=<hmac>
        │
        ▼
FastAPI webhook handler:
  1. Verify HMAC signature → reject if invalid
  2. Check delivery_id in webhook_events table → idempotency guard
  3. Log event to DB (processed: false)
  4. Return 200 OK immediately ← GitHub satisfied
  5. Dispatch background task: route_event(...)
        │
        ▼ (async background, user sees GitHub ACK instantly)
Event Router:
  event_type == "issues" + action == "opened"
  → Quick ML classify: "bug" (confidence: 0.94)
  → Route to: IssueTriage pipeline
        │
        ▼
IssueTriage Pipeline:
  Step 1: Full ML classification
    Input: "App crashes on large file upload [issue body]"
    Output: {type: "bug", confidence: 0.94, is_question: false}
    Time: ~8ms

  Step 2: Duplicate detection
    Embed issue text (bge-base, local)
    Search ChromaDB: repo_{id}_issues collection
    Result: Issue #198 similarity 0.91 "crash large file"
    → Likely duplicate found

  Step 3: Owner suggestion
    Search codebase embeddings: "file upload crash large"
    Related files: upload.py, middleware/file_handler.py
    Git blame via GitHub API (cached in Redis 1hr):
    → @alice touched upload.py 8 times recently
    → Suggested owner: @alice

  Step 4: LangChain Agent reasoning
    Input: classification + duplicate + owner + issue content
    Agent thinks:
      "Duplicate of #198 (similarity 0.91)
       Should: add 'duplicate' label, reference original,
       suggest checking if fixed in latest version,
       suggest @alice as owner"
    Output: structured action list

  Step 5: Execute on GitHub (installation token from Redis cache)
    PATCH /repos/owner/repo/issues/247/labels → ["bug", "duplicate"]
    POST  /repos/owner/repo/issues/247/comments
      → "Hi! This looks similar to #198 (closed in v2.3).
         Are you on the latest version? Suggested: @alice 👋"

  Step 6: Persist + broadcast
    INSERT into issues table
    INSERT into ai_actions table (full audit trail)
    WebSocket broadcast → dashboard activity feed updates live

Total time: 8–14 seconds from webhook receipt to GitHub comment
```

---

## 3. Request Lifecycle — Contributor Question

```
New contributor opens Issue #301:
"How do I set up the dev environment on Windows?"
        │
        ▼
Webhook → ML classify → type: "question" (0.89)
        │
        ▼
ContributorHelper Pipeline:

  Query construction:
    "how to set up dev environment Windows {repo_name}"

  Multi-collection RAG:
    Search repo_{id}_docs    → CONTRIBUTING.md section on setup
    Search repo_{id}_issues  → Issue #45: "Windows setup tips"
    Search repo_{id}_code    → requirements.txt, setup.py
    Top-4 per collection → 12 candidates
    Cross-encoder reranking → top-6 final

  Confidence scoring:
    6 strong chunks found → confidence: 0.82 (HIGH)
    → Proceed with full answer

  LLM synthesis (Gemini Flash):
    System: "Helpful maintainer. Answer from context only.
             Reference exact files. Welcoming tone."
    Context: [6 ranked chunks]
    Output: Specific Windows setup steps with gotchas

  Gap detection:
    Confidence 0.82 → above threshold (0.5) → no gap issue

  GitHub actions:
    POST comment: [answer + "Sources: CONTRIBUTING.md, #45"]
    Add labels: ["question", "answered"]

  Audit trail:
    ai_actions: {event_type: "contributor_help", confidence: 0.82}
    WebSocket: "Answered question #301"
```

---

## 4. Data Flow Diagram

```
[GitHub]──webhook──▶[FastAPI]──verify──▶[Event Router]
                        │                      │
                     ACK 200           ┌───────┴────────┐
                                       │                │
                               [Issue Pipeline]  [Commit Pipeline]
                                       │                │
                    ┌──────────────────┤                ├─────────────┐
                    │                  │                │             │
              [ML Classifier]  [ChromaDB]        [ML Classifier] [ChromaDB]
              .pkl local        Vector Search    .pkl local       Codebase
                    │                  │                │
                    └──────────────────▼────────────────┘
                                       │
                               [LangChain Agent]
                                       │
                               [Gemini/Groq LLM]
                                       │
                    ┌──────────────────▼────────────────┐
                    │                                   │
              [GitHub API]                        [Supabase DB]
              Labels, Comments                    ai_actions, issues
                    │                                   │
                    └──────────────┬────────────────────┘
                                   │
                            [WebSocket]
                            Dashboard live
```

---

## 5. Idempotency Design

Critical: GitHub retries webhooks if they don't get a 200 response. Must not process the same event twice.

```
Every webhook has a unique X-GitHub-Delivery header.

On receipt:
  SELECT id FROM webhook_events WHERE delivery_id = $1
  → Found? Return "already_processed" immediately
  → Not found? Insert + process

This prevents:
  - Double labels on an issue
  - Duplicate comments posted
  - Double entries in ai_actions table
  - Wasted LLM API calls

delivery_id is indexed in Supabase for fast lookup.
```

---

## 6. GitHub App Token Management

```
Problem: Installation tokens expire after 60 minutes.
         Creating a new one requires signing a JWT with private key.
         Doing this on every API call is slow and wasteful.

Solution: Cache in Upstash Redis.

Flow:
  get_github_client(installation_id):
    1. Check Redis: "github_token:{installation_id}"
    2. Hit → return Github(cached_token)
    3. Miss:
         a. Sign JWT with App private key (valid 10 min)
         b. POST /app/installations/{id}/access_tokens
         c. Get token (valid 60 min)
         d. Cache in Redis: TTL = 3300s (55 min, safe margin)
         e. Return Github(new_token)

Result:
  First call per repo: ~300ms (token generation)
  Subsequent calls: ~5ms (Redis hit)
  Auto-refresh: happens naturally when TTL expires
```

---

## 7. ChromaDB Multi-Collection Design

```
Per repo, 4 collections:

repo_{id}_code
  What: Function-level code chunks
  When indexed: On first add + incremental on push
  Chunk size: 800 tokens, 150 overlap
  Used by: Duplicate detection context, owner suggestion,
           contributor help (code examples)

repo_{id}_docs
  What: README, CONTRIBUTING.md, docs/, wiki pages
  When indexed: On first add + on push touching doc files
  Chunk size: 600 tokens, 100 overlap
  Used by: Contributor helper (primary source)

repo_{id}_issues
  What: Closed/resolved issues (title + body + resolution)
  When indexed: Batch on first add + on issue.closed event
  Chunk size: Full issue (usually < 500 tokens)
  Used by: Duplicate detection, contributor helper (past answers)

repo_{id}_commits
  What: Commit message + affected files summary
  When indexed: Append-only on each push
  Chunk size: Per commit
  Used by: "When was X added?" queries, release assistant

Multi-collection search strategy:
  Query all relevant collections
  Get k=4 per collection
  Merge: 16 candidates total
  Cross-encoder reranking (ms5-base-multilingual)
  Return top-6 most relevant across all collections
  → Better than single-collection search
  → Ensures answers draw from docs + issues + code together
```

---

## 8. Webhook Security Model

```
THREAT: Attacker sends fake GitHub events to /webhooks/github
IMPACT: Orbiter posts unwanted comments, adds wrong labels

DEFENSE: HMAC-SHA256 signature verification

Every real GitHub webhook includes:
  X-Hub-Signature-256: sha256=<hash>
  where hash = HMAC(payload_bytes, webhook_secret)

Orbiter verifies:
  1. Header present?
  2. Starts with "sha256="?
  3. HMAC(payload, our_secret) == received hash?
     Using hmac.compare_digest() — timing-attack safe
  4. All three pass? Process.
     Any fail? Return 401 immediately.

webhook_secret stored only in:
  → Koyeb environment variables (backend)
  → GitHub App settings
  Never in code. Never in git.

Additional: rate limit webhook endpoint
  Upstash Redis: max 100 requests/min per IP
  Prevents DoS even from valid-looking requests
```

---

## 9. Always-On Tracking

```
APScheduler runs inside FastAPI process on Koyeb.
Koyeb never sleeps (unlike Render free tier).
Browser state is irrelevant.

Scheduled jobs:

Every 30 mins: commit_polling_fallback
  → Catches any commits missed by webhook
  → Last defense against missed events

Every day at 2am UTC: stale_issue_checker (Phase 2)
  → Find issues with no activity > 60 days
  → Post "is this still relevant?" comment
  → Add "stale" label

Every day at 9am UTC: email_digest_sender
  → Summarize Orbiter's actions from past 24h
  → Send to repo owner via Resend

User closes browser at 11pm:
  → Nothing changes
  → At 11:30pm: scheduler polls commits
  → At 2am: stale checker runs
  → At 9am: digest email sent
  → User opens browser → all activity logged, waiting
```

---

## 10. Auth Protection — Middleware

```
WRONG pattern (previous project):
  Browser requests /dashboard
  → Next.js sends HTML + JS
  → Browser renders page (protected content visible)
  → useEffect fires, checks auth
  → Redirect if no session
  Problem: protected content briefly visible, API calls may fire

CORRECT pattern (Orbiter):
  Browser requests /dashboard
  → Vercel Edge intercepts (before server, before HTML)
  → middleware.ts runs
  → No Supabase session? → 302 to /login
  → Has session? → allow through
  Result: user never receives protected HTML without auth

Protected routes: /dashboard, /repo/*, /settings
Public routes: /, /login

The middleware file (frontend/middleware.ts) is the
single source of truth for auth. Nothing else needed.
```

---

## 11. Error Handling Strategy

```
Webhook verification fails:
  → 401 immediately, log to Supabase, alert

Pipeline exception:
  → Catch all exceptions in pipeline
  → Update webhook_events.error column
  → WebSocket: push error event to dashboard
  → Never crash the main process
  → Retry: APScheduler polls catch missed events

GitHub API rate limit (429):
  → Exponential backoff: 2s, 4s, 8s, 16s
  → After 4 retries: log as failed, continue
  → Rate limit rarely hit: 5k/hr per installation

LLM API down (Gemini):
  → Automatic fallback to Groq
  → If both down: save ML result only
  → action saved with reasoning: "LLM unavailable"

ChromaDB empty (new repo, not indexed yet):
  → Skip RAG steps
  → Proceed with ML + fallback logic only
  → Trigger indexing in background

Duplicate webhook delivery:
  → delivery_id check catches this immediately
  → Return 200 "already_processed"
  → No duplicate actions
```

---

## 12. Repo Health Score

```python
def calculate_health_score(repo_id: str, days: int = 30) -> int:
    """
    Score 0-100 based on recent activity patterns.
    Combines commit quality + issue responsiveness + code stability.
    """
    commits = get_recent_commits(repo_id, days)
    issues = get_recent_issues(repo_id, days)

    # Component 1: Commit quality (0-1)
    breaking = sum(1 for c in commits if c["is_breaking"])
    breaking_ratio = breaking / max(len(commits), 1)
    commit_quality = 1.0 - min(breaking_ratio * 2, 0.5)

    # Component 2: Activity level (0-1)
    activity = min(len(commits) / 20, 1.0)  # 20+ commits = max score

    # Component 3: Issue response rate (0-1)
    triaged = sum(1 for i in issues if i["orbiter_responded"])
    response_rate = triaged / max(len(issues), 1)

    # Component 4: Bug ratio (0-1, lower bugs = higher score)
    bugs = sum(1 for c in commits if c["commit_type"] == "bug_fix")
    bug_ratio = bugs / max(len(commits), 1)
    bug_score = 1.0 - min(bug_ratio * 1.5, 0.4)

    score = (
        commit_quality * 0.35 +
        activity       * 0.25 +
        response_rate  * 0.25 +
        bug_score      * 0.15
    ) * 100

    return round(score)
```

---

## 13. Free Tier Usage Analysis

```
Gemini Flash (free: 1M tokens/day, 15 RPM):
  Per issue triage: ~800 tokens
  Per contributor answer: ~1,200 tokens
  Per commit analysis: ~500 tokens
  Daily budget at 1M tokens:
    ~500 issue triages OR ~833 commit analyses
  Well within limits for a portfolio project

Groq/Llama (free: 14,400 req/day):
  Fallback only — Gemini primary
  Emergency reserve

Upstash Redis (free: 10,000 commands/day):
  GitHub token cache: ~50 reads/day
  Classification cache: ~200 reads/day
  Issue list cache: ~100 reads/day
  Rate limit counters: ~500 reads/day
  Total: ~850/day — well within 10k limit

GitHub API (free: 5,000 req/hr per installation):
  Per issue: ~5 calls (get issue, add labels, post comment)
  Per commit: ~3 calls (get diff, get blame)
  At 100 events/day: ~500 calls/day → no problem

Supabase (free: 500MB, 50k MAU):
  ~1KB per ai_action row
  ~2KB per issue row
  At 1000 events: ~3MB → well within 500MB
```

---

## 14. What Makes This Different — Technical Summary

```
Basic RAG app:                     Orbiter:
─────────────────────────          ────────────────────────────────
User asks → AI answers             GitHub event → AI acts (no user)
Single collection search           Multi-collection cross-encoder RAG
General LLM responses              Structured output → real GitHub actions
No external integrations           GitHub App webhooks + API write access
No ML model                        Trained classifier (.pkl) runs locally
Static                             Real-time WebSocket dashboard
Polling (slow, wasteful)           Webhooks (instant, efficient)
No audit trail                     Full action log with reasoning
No security                        HMAC verification + idempotency
```

---

*System Design v1.0 — Orbiter*
