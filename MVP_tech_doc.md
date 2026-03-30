# MVP Technical Document
## Orbiter — Build Guide
**Version:** 1.0 | **Date:** March 2026 | **Timeline:** 5 weeks

---

## 1. MVP Scope

```
✅ GitHub App setup (webhooks, real-time events)
✅ Issue Triage Agent (classify → label → assign → comment)
✅ Contributor Helper (question → RAG → answer)
✅ Commit Intelligence from v1 (classifier, embeddings, health score)
✅ Live dashboard with audit trail (WebSocket)
✅ Route auth protection (Next.js middleware)
✅ Manual re-index trigger
✅ Always-on background tracking (APScheduler on Koyeb)
✅ 100% free deployment — no local setup required
```

Phase 2 (post-MVP): PR Reviewer, Release Assistant, stale issue closer.

---

## 2. Tech Stack (100% Free, Cloud-Only)

```
Frontend        Next.js 14 (App Router) + middleware.ts auth guard
Styling         Tailwind CSS
Animations      Framer Motion + GSAP + Magic UI
Icons           Lucide React
UI Components   Shadcn/ui

Backend         FastAPI (Python 3.11) + Uvicorn
Scheduler       APScheduler (in-process, always-on on Koyeb)
Agent           LangChain (ReAct agent + custom tools)
LLM Primary     Google Gemini 1.5 Flash  → free: 1M tokens/day
LLM Fallback    Groq — Llama 3.1 70B     → free: 14,400 req/day
Embeddings      BAAI/bge-base-en-v1.5    → free: runs in Koyeb container
Vector DB       ChromaDB                 → free: Koyeb persistent disk
ML Model        scikit-learn RandomForest → free: .pkl in repo
GitHub          PyGithub + github-app-token → free: 5k/hr per install

Database        Supabase Postgres        → free: 500MB
Auth            Supabase Auth + Google OAuth → free
Storage         Supabase Storage         → free: 1GB
Cache           Upstash Redis            → free: 10,000 req/day
Email           Resend                   → free: 3,000/month
Webhooks        GitHub App               → free: unlimited
Real-time       FastAPI WebSockets       → free: built-in

Deploy BE       Koyeb                    → free: never sleeps, persistent disk
Deploy FE       Vercel                   → free: auto-deploy, Edge CDN
CI/CD           GitHub Actions           → free: public repos
Uptime          UptimeRobot              → free: 5-min ping
Domain          is-a.dev                 → free: yourname.is-a.dev
```

---

## 3. Project Structure

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

---

## 4. Environment Variables

```env
# .env.example — add all to Koyeb dashboard (backend) + Vercel (frontend)

# GitHub App (register at github.com/settings/apps/new)
GITHUB_APP_ID=                        # Numeric App ID
GITHUB_APP_PRIVATE_KEY=               # Full PEM key (multiline — use \n in env)
GITHUB_WEBHOOK_SECRET=                # Random string you set during App creation
GITHUB_CLIENT_ID=                     # For OAuth (optional)
GITHUB_CLIENT_SECRET=                 # For OAuth (optional)

# LLM (free — aistudio.google.com + console.groq.com)
GEMINI_API_KEY=
GROQ_API_KEY=

# Supabase (free — supabase.com)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Upstash Redis (free — console.upstash.com)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Resend (free — resend.com)
RESEND_API_KEY=
FROM_EMAIL=noreply@orbiter.is-a.dev

# App
JWT_SECRET_KEY=                       # 64-char random string
FRONTEND_URL=https://orbiter.vercel.app
CHROMA_PERSIST_DIR=/app/chroma_db     # Koyeb persistent disk
ENVIRONMENT=production
```

---

## 5. Core Code

### 5.1 `webhooks/handler.py` — Entry Point

```python
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from webhooks.security import verify_github_webhook
from webhooks.router import route_event
from db.supabase import supabase
from core.config import settings
import json

router = APIRouter()

@router.post("/webhooks/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receives all GitHub App events.
    Must ACK within 10 seconds — all processing in background.
    """
    payload_bytes = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")
    delivery_id = request.headers.get("X-GitHub-Delivery", "")
    event_type = request.headers.get("X-GitHub-Event", "")

    # 1. Verify HMAC signature — reject anything not from GitHub
    if not verify_github_webhook(payload_bytes, signature, settings.GITHUB_WEBHOOK_SECRET):
        raise HTTPException(401, "Invalid webhook signature")

    payload = json.loads(payload_bytes)

    # 2. Idempotency — don't process duplicate deliveries
    existing = supabase.table("webhook_events")\
        .select("id").eq("delivery_id", delivery_id).execute()
    if existing.data:
        return {"status": "already_processed"}

    # 3. Log event
    supabase.table("webhook_events").insert({
        "delivery_id": delivery_id,
        "event_type": event_type,
        "repo_full_name": payload.get("repository", {}).get("full_name"),
        "payload": payload,
        "processed": False
    }).execute()

    # 4. ACK immediately — GitHub needs response fast
    # 5. Process in background — never block the response
    background_tasks.add_task(route_event, event_type, payload, delivery_id)

    return {"status": "accepted", "delivery_id": delivery_id}
```

### 5.2 `webhooks/security.py`

```python
import hmac
import hashlib

def verify_github_webhook(payload_bytes: bytes, signature_header: str,
                          secret: str) -> bool:
    """Verify GitHub HMAC-SHA256 webhook signature."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        secret.encode("utf-8"), payload_bytes, hashlib.sha256
    ).hexdigest()
    received = signature_header[len("sha256="):]
    return hmac.compare_digest(expected, received)  # Timing-attack safe
```

### 5.3 `webhooks/router.py`

```python
from pipelines.issue_triage import run_issue_triage
from pipelines.contributor_help import run_contributor_help
from pipelines.commit_intel import run_commit_intel
from core.ml.classifier import classify_text
from db.supabase import supabase

async def route_event(event_type: str, payload: dict, delivery_id: str):
    """Route GitHub events to the correct pipeline."""
    try:
        repo_full = payload.get("repository", {}).get("full_name", "")
        repo = get_repo_from_db(repo_full)
        if not repo:
            return  # Repo not registered with Orbiter

        if event_type == "issues" and payload.get("action") == "opened":
            issue = payload["issue"]

            # Quick ML classification to route correctly
            classification = classify_text(
                f"{issue['title']} {issue['body'] or ''}"
            )

            if classification["type"] == "question":
                await run_contributor_help(issue, repo)
            else:
                await run_issue_triage(issue, repo, classification)

        elif event_type == "push":
            commits = payload.get("commits", [])
            for commit in commits:
                await run_commit_intel(commit, repo)

        # Mark as processed
        supabase.table("webhook_events")\
            .update({"processed": True})\
            .eq("delivery_id", delivery_id)\
            .execute()

    except Exception as e:
        supabase.table("webhook_events")\
            .update({"error": str(e)})\
            .eq("delivery_id", delivery_id)\
            .execute()

def get_repo_from_db(full_name: str):
    parts = full_name.split("/")
    if len(parts) != 2:
        return None
    result = supabase.table("repositories")\
        .select("*")\
        .eq("owner", parts[0])\
        .eq("repo_name", parts[1])\
        .execute()
    return result.data[0] if result.data else None
```

### 5.4 `pipelines/issue_triage.py`

```python
from core.ml.classifier import classify_text
from core.rag.retriever import search_issues
from core.agent.pipeline import run_agent
from services.github_app import get_github_client
from services.cache import get_cached, set_cached
from db.supabase import supabase
from services.websocket_manager import ws_manager
import json

async def run_issue_triage(issue: dict, repo: dict, classification: dict):
    """
    Full issue triage pipeline:
    1. Duplicate detection via embeddings
    2. Owner suggestion via git blame
    3. Agent decides actions
    4. Execute on GitHub
    """
    gh = get_github_client(repo["installation_id"])
    gh_repo = gh.get_repo(f"{repo['owner']}/{repo['repo_name']}")

    # Step 1: Duplicate detection
    similar_issues = await search_issues(
        query=f"{issue['title']} {issue['body'] or ''}",
        repo_id=repo["id"],
        k=3
    )
    duplicate = None
    if similar_issues and similar_issues[0]["score"] > 0.88:
        duplicate = similar_issues[0]

    # Step 2: Owner suggestion
    suggested_owner = await suggest_owner(
        issue_text=f"{issue['title']} {issue['body'] or ''}",
        repo=repo, gh_repo=gh_repo
    )

    # Step 3: Agent decides actions
    agent_input = f"""
    Repository: {repo['owner']}/{repo['repo_name']}
    New Issue #{issue['number']}: {issue['title']}
    Body: {issue['body'] or 'No description'}
    Classification: {classification['type']} (confidence: {classification['confidence']})
    Duplicate of: Issue #{duplicate['number']} - {duplicate['title']} (similarity: {duplicate['score']:.2f}) {'(FOUND)' if duplicate else '(NONE)'}
    Suggested owner: {suggested_owner or 'unknown'}

    Decide what actions to take. Available actions:
    - add_label(label): bug, enhancement, question, duplicate, needs-reproduction, good-first-issue
    - post_comment(body): post a helpful comment
    - suggest_assignee(username): suggest who should handle this
    """

    result = await run_agent(agent_input, repo)
    actions_taken = parse_agent_actions(result)

    # Step 4: Execute on GitHub
    executed = []
    for action in actions_taken:
        try:
            if action["type"] == "add_label":
                # Create label if it doesn't exist
                ensure_label_exists(gh_repo, action["value"])
                gh_repo.get_issue(issue["number"]).add_to_labels(action["value"])
                executed.append(action)

            elif action["type"] == "post_comment":
                footer = "\n\n---\n*🤖 Orbiter AI · [View reasoning](https://orbiter.is-a.dev)*"
                gh_repo.get_issue(issue["number"]).create_comment(
                    action["value"] + footer
                )
                executed.append(action)

            elif action["type"] == "suggest_assignee" and action["value"]:
                # Post as comment (not force-assign — let maintainer decide)
                gh_repo.get_issue(issue["number"]).create_comment(
                    f"👋 Suggested assignee based on codebase history: @{action['value']}"
                )
                executed.append(action)
        except Exception as e:
            print(f"Action failed: {action} — {e}")

    # Step 5: Save to DB + push to dashboard
    action_record = {
        "repo_id": repo["id"],
        "event_type": "issue_triage",
        "target_type": "issue",
        "target_number": issue["number"],
        "actions_taken": executed,
        "reasoning": result,
        "ml_classification": classification
    }
    supabase.table("ai_actions").insert(action_record).execute()
    supabase.table("issues").insert({
        "repo_id": repo["id"],
        "github_issue_id": issue["id"],
        "number": issue["number"],
        "title": issue["title"],
        "body": issue["body"],
        "classified_type": classification["type"],
        "confidence": classification["confidence"],
        "is_duplicate": duplicate is not None,
        "duplicate_of": duplicate["number"] if duplicate else None,
        "suggested_owner": suggested_owner,
        "orbiter_responded": True
    }).execute()

    await ws_manager.broadcast_to_repo(repo["id"], {
        "type": "issue_triaged",
        "issue_number": issue["number"],
        "issue_title": issue["title"],
        "classification": classification["type"],
        "actions": [a["type"] for a in executed],
        "message": f"Triaged issue #{issue['number']}: {issue['title']}"
    })


async def suggest_owner(issue_text: str, repo: dict, gh_repo) -> str | None:
    """Find who should own this issue based on related code."""
    from core.rag.retriever import search_codebase
    related_files = await search_codebase(issue_text, repo["id"], k=3)
    if not related_files:
        return None

    contributor_scores = {}
    for file_chunk in related_files:
        filepath = file_chunk["metadata"].get("file_path", "")
        if not filepath:
            continue
        cache_key = f"blame:{repo['owner']}_{repo['repo_name']}_{filepath}"
        cached = await get_cached(cache_key)
        if cached:
            commits = json.loads(cached)
        else:
            try:
                commits = list(gh_repo.get_commits(path=filepath))[:10]
                commits = [c.author.login for c in commits if c.author]
                await set_cached(cache_key, json.dumps(commits), ttl=3600)
            except Exception:
                continue
        for author in commits:
            contributor_scores[author] = contributor_scores.get(author, 0) + 1

    if not contributor_scores:
        return None
    return max(contributor_scores, key=contributor_scores.get)
```

### 5.5 `pipelines/contributor_help.py`

```python
from core.rag.retriever import multi_collection_search
from core.agent.pipeline import get_llm
from services.github_app import get_github_client
from services.websocket_manager import ws_manager
from db.supabase import supabase
from langchain_core.prompts import ChatPromptTemplate

ANSWER_PROMPT = """You are a helpful open-source maintainer answering a contributor question.

Answer based ONLY on the provided context from the repository.
Be specific. Reference exact file names and sections.
Use a friendly, welcoming tone — this person is trying to contribute.
If the context doesn't fully answer the question, say what you do know
and what they might need to find themselves.

Context from repository:
{context}

Question: {question}

Answer:"""

async def run_contributor_help(issue: dict, repo: dict):
    """Answer contributor questions using RAG over repo docs + past issues."""
    gh = get_github_client(repo["installation_id"])
    gh_repo = gh.get_repo(f"{repo['owner']}/{repo['repo_name']}")

    question = f"{issue['title']} {issue['body'] or ''}"

    # Multi-collection RAG: docs + past issues + code
    chunks = await multi_collection_search(
        query=question,
        repo_id=repo["id"],
        collections=["docs", "issues", "code"],
        k_per_collection=4
    )

    if not chunks:
        # No context → honest fallback
        answer = (
            "Thanks for your question! I don't have enough context "
            "in the repository docs to answer this fully. "
            "Please check the README and CONTRIBUTING.md, "
            "or a maintainer will follow up shortly."
        )
        confidence = 0.0
    else:
        context = "\n\n---\n\n".join([
            f"[{c['metadata'].get('source', 'repo')}]\n{c['content']}"
            for c in chunks
        ])

        prompt = ChatPromptTemplate.from_template(ANSWER_PROMPT)
        llm = get_llm()
        chain = prompt | llm
        answer = (await chain.ainvoke({
            "context": context,
            "question": question
        })).content

        # Confidence: how well did our chunks cover the question?
        confidence = min(len(chunks) / 8, 1.0)

    # Post answer
    footer = "\n\n---\n*🤖 Orbiter AI answered based on repository docs and past issues.*"
    sources = list(set([
        c["metadata"].get("file_path", "")
        for c in chunks if c["metadata"].get("file_path")
    ]))[:3]
    if sources:
        footer += f"\n*Sources: {', '.join(sources)}*"

    gh_repo.get_issue(issue["number"]).create_comment(answer + footer)
    gh_repo.get_issue(issue["number"]).add_to_labels("question")

    # Docs gap detection
    if confidence < 0.5:
        gap_title = f"docs: question not covered — \"{issue['title'][:60]}\""
        gh_repo.create_issue(
            title=gap_title,
            body=f"A contributor asked:\n\n> {issue['title']}\n\n"
                 f"Orbiter couldn't find a good answer in the docs. "
                 f"Consider adding this to CONTRIBUTING.md.\n\n"
                 f"Related issue: #{issue['number']}",
            labels=["documentation"]
        )

    # Save + push
    supabase.table("ai_actions").insert({
        "repo_id": repo["id"],
        "event_type": "contributor_help",
        "target_type": "issue",
        "target_number": issue["number"],
        "actions_taken": [{"type": "post_answer", "confidence": confidence}],
        "reasoning": f"Answered with {len(chunks)} context chunks, confidence {confidence:.2f}"
    }).execute()

    await ws_manager.broadcast_to_repo(repo["id"], {
        "type": "question_answered",
        "issue_number": issue["number"],
        "confidence": confidence,
        "message": f"Answered question #{issue['number']}: {issue['title'][:50]}"
    })
```

### 5.6 `services/github_app.py`

```python
import time
import jwt as pyjwt
import httpx
from github import Github, GithubIntegration
from core.config import settings
from services.cache import get_cached, set_cached
import json

def get_github_integration() -> GithubIntegration:
    """GitHub App integration client (signs JWTs with private key)."""
    return GithubIntegration(
        integration_id=int(settings.GITHUB_APP_ID),
        private_key=settings.GITHUB_APP_PRIVATE_KEY.replace("\\n", "\n")
    )

def get_github_client(installation_id: int) -> Github:
    """
    Get GitHub client authenticated for a specific repo installation.
    Uses cached token (refreshed every 55 mins).
    """
    cache_key = f"github_token:{installation_id}"

    # Check cache first
    cached = get_cached_sync(cache_key)
    if cached:
        token_data = json.loads(cached)
        return Github(token_data["token"])

    # Generate new installation access token
    integration = get_github_integration()
    token = integration.get_access_token(installation_id)

    # Cache for 55 mins (tokens last 60 mins)
    set_cached_sync(cache_key, json.dumps({"token": token.token}), ttl=3300)

    return Github(token.token)
```

### 5.7 `frontend/middleware.ts`

```typescript
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/login"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const isPublic = PUBLIC_ROUTES.some(r => req.nextUrl.pathname === r)

  if (!session && !isPublic) {
    const url = new URL("/login", req.url)
    url.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
```

### 5.8 Key Frontend Components

```tsx
// ActionCard.tsx — Shows what Orbiter did + why (expandable)
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Bot } from "lucide-react"

export function ActionCard({ action }) {
  const [expanded, setExpanded] = useState(false)

  const typeColors = {
    issue_triage:     "border-blue-500/30 bg-blue-500/5",
    contributor_help: "border-green-500/30 bg-green-500/5",
    commit_analysis:  "border-purple-500/30 bg-purple-500/5",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${typeColors[action.event_type] || "border-zinc-800"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-zinc-200 text-sm font-medium">
              {formatActionTitle(action)}
            </span>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {action.actions_taken?.map((a, i) => (
                <span key={i} className="text-xs bg-zinc-800 text-zinc-400
                                         rounded px-1.5 py-0.5 font-mono">
                  {a.type}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)}
                className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown size={14} />
          </motion.div>
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-zinc-800"
          >
            <p className="text-xs text-zinc-500 font-mono leading-relaxed">
              {action.reasoning}
            </p>
            {action.ml_classification && (
              <div className="mt-2 flex gap-2 text-xs">
                <span className="text-zinc-600">ML:</span>
                <span className="text-zinc-400 font-mono">
                  {action.ml_classification.type}
                  ({(action.ml_classification.confidence * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function formatActionTitle(action) {
  if (action.event_type === "issue_triage")
    return `Triaged Issue #${action.target_number}`
  if (action.event_type === "contributor_help")
    return `Answered Question #${action.target_number}`
  if (action.event_type === "commit_analysis")
    return `Analyzed Commit`
  return "AI Action"
}
```

---

## 6. GitHub App Setup (Step-by-Step)

```
1. Go to github.com/settings/apps/new

2. Fill in:
   Name: Orbiter
   Homepage: https://orbiter.is-a.dev
   Webhook URL: https://your-app.koyeb.app/webhooks/github
   Webhook secret: generate a random 32-char string
                   → save as GITHUB_WEBHOOK_SECRET

3. Permissions (Repository):
   Issues: Read & Write
   Pull requests: Read & Write
   Contents: Read-only
   Metadata: Read-only

4. Subscribe to events:
   ✅ Issues
   ✅ Pull request
   ✅ Push
   ✅ Release

5. Create GitHub App → note the App ID → save as GITHUB_APP_ID

6. Generate private key → download .pem file
   → copy contents → save as GITHUB_APP_PRIVATE_KEY
   → in Koyeb: replace newlines with \n

7. Deploy backend to Koyeb first
   Then come back and set the webhook URL

8. Install app on a test repo to verify webhooks fire
   → Check Koyeb logs for incoming webhook events
```

---

## 7. Deployment

### Backend → Koyeb
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```
Koyeb settings:
  Build: Dockerfile
  Port: 8000
  Persistent disk: /app/chroma_db (1GB)
  
  Environment variables: (all from .env.example)
```

### Frontend → Vercel
```bash
cd frontend && npx vercel --prod
# Add in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-app.koyeb.app
# NEXT_PUBLIC_WS_URL=wss://your-app.koyeb.app
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 8. Build Checklist — Week by Week

### Week 1 — ML + Backend Core
```
□ Train unified classifier (commits + issues) → 85%+ accuracy
□ FastAPI app skeleton + all routes stubbed
□ Supabase schema applied (all tables)
□ ChromaDB indexer working on test repo
□ /health endpoint live on Koyeb
□ UptimeRobot pinging /health every 5 mins
```

### Week 2 — GitHub App + Webhooks
```
□ GitHub App registered with correct permissions
□ HMAC webhook verification working
□ Webhook handler ACKs immediately, processes in background
□ Idempotency check (no double-processing)
□ Event router dispatching correctly by event type
□ Installation token caching in Redis working
□ Test: open issue on repo → see webhook hit in Koyeb logs
```

### Week 3 — Issue Triage + Contributor Help
```
□ Issue classification via ML model
□ Duplicate detection via ChromaDB search
□ Owner suggestion via git blame
□ Labels applied to real GitHub issues
□ Comment posted on real GitHub issues
□ Contributor help RAG working (docs + issues + code)
□ Answer posted on question-type issues
□ Docs gap detection creating new issues
□ WebSocket pushing events to frontend
```

### Week 4 — Frontend Dashboard
```
□ middleware.ts auth guard (test: /dashboard without login → /login instantly)
□ Google OAuth login
□ Dashboard with repo cards + health scores
□ Repo detail page: commit timeline + issue triage log
□ ActionCard with expandable reasoning
□ Live activity feed (WebSocket)
□ ReindexButton with progress animation
□ GSAP health score animation
□ Mobile responsive
```

### Week 5 — Polish + Launch
```
□ Error handling + loading skeletons everywhere
□ README: architecture diagram + demo GIF + ML accuracy metrics
□ GitHub App listed publicly (anyone can install)
□ Demo: install on fastapi/fastapi or a real OSS repo you contribute to
□ Record 2-min demo video showing: issue opened → Orbiter labels + comments in <15s
□ Deploy custom domain via is-a.dev
□ GitHub Actions CI/CD active
```

---

## 9. Interview Answer

> "I built Orbiter, an autonomous AI maintainer for GitHub repos. It installs as a GitHub App and receives real-time webhook events. When an issue is opened, a trained scikit-learn classifier determines if it's a bug, feature request, question, or duplicate — in under 10ms, locally, no API call. Then a LangChain ReAct agent searches a ChromaDB vector store of the codebase and past issues to understand context, suggests an owner using git blame analysis, and posts a contextual GitHub comment with appropriate labels — all within 15 seconds of the issue being opened. For contributor questions, it uses RAG over the repo docs and past resolved issues to synthesize an answer and post it directly. The whole system runs on Koyeb with FastAPI, APScheduler for background monitoring, and Supabase for persistence — deployed entirely for free."

---

*MVP Tech Doc v1.0 — Orbiter | Est. build time: 5 weeks*
