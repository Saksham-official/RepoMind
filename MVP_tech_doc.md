# MVP Technical Document
## RepoMind — Build Guide
**Version:** 1.0 | **Date:** March 2026 | **Timeline:** 4 weeks

---

## 1. MVP Scope

Build the full core loop end-to-end:
✅ Add repo → index codebase → monitor commits → ML classify → agent analyzes → dashboard shows live → email digest sent
✅ Route-level auth protection (middleware — no page accessible without login)
✅ Manual re-index trigger (refresh codebase on demand)
✅ Background tracking always-on (works when app is closed)
✅ 100% free deployment — no local setup, no paid APIs

That's a complete, impressive, deployable product.

---

### Why closing the app doesn't stop tracking

The scheduler lives inside your **FastAPI process on Koyeb** — not in the browser. When a user closes the tab or shuts their laptop, the backend is still running on Koyeb's servers, polling GitHub every 30 minutes for every monitored repo. The frontend is just a display layer. It shows what the backend already collected. Open the app tomorrow and all commits from overnight are already analyzed and waiting.

---

## 2. Full Tech Stack (100% Free, Cloud-Only)

> ⚠️ **No local setup needed.** Everything runs on free cloud tiers. Just push to GitHub and it's live.

```
Frontend        Next.js 14 (App Router)
Styling         Tailwind CSS
Animations      Framer Motion + GSAP + Magic UI
Icons           Lucide React
UI Components   Shadcn/ui

Backend         FastAPI (Python 3.11) + Uvicorn
Scheduler       APScheduler (in-process, always-on on Koyeb)
Agent           LangChain (ReAct agent + tools)
LLM Primary     Google Gemini 1.5 Flash  → free: 1M tokens/day, 15 RPM
LLM Fallback    Groq API — Llama 3.1 70B → free: 14,400 req/day
Embeddings      BAAI/bge-base-en-v1.5    → free: runs in Koyeb container
Vector DB       ChromaDB                 → free: persistent disk on Koyeb
ML Model        scikit-learn RandomForest → free: .pkl served locally
GitHub API      PyGithub                 → free: 5,000 req/hr (authenticated)

Database        Supabase Postgres        → free: 500MB
Auth            Supabase Auth            → free: Google OAuth built-in
Storage         Supabase Storage         → free: 1GB
Cache           Upstash Redis            → free: 10,000 commands/day
Email           Resend                   → free: 3,000 emails/month
Real-time       FastAPI WebSockets       → free: built-in

Deploy BE       Koyeb                    → free: never sleeps, persistent disk
Deploy FE       Vercel                   → free: auto-deploy, global CDN
CI/CD           GitHub Actions           → free: public repos
Uptime          UptimeRobot              → free: 5-min ping
Domain          is-a.dev subdomain       → free: yourname.is-a.dev
```

---

## 3. Project Structure

```
repomind/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── api/v1/
│   │   ├── auth.py           # JWT + Google OAuth via Supabase
│   │   ├── repos.py          # Add/remove/list repos + reindex trigger
│   │   ├── commits.py        # Commit history + analysis
│   │   ├── agent.py          # Trigger agent manually
│   │   └── ws.py             # WebSocket feed endpoint
│   │
│   ├── core/
│   │   ├── config.py         # Settings via pydantic-settings
│   │   ├── security.py       # JWT validation dependency
│   │   │
│   │   ├── ml/
│   │   │   ├── classifier.py # Load + serve .pkl model
│   │   │   └── features.py   # Feature extraction for commits
│   │   │
│   │   ├── agent/
│   │   │   ├── pipeline.py   # Main agent orchestration
│   │   │   ├── tools.py      # All 5 LangChain tools
│   │   │   └── prompts.py    # System prompts
│   │   │
│   │   └── rag/
│   │       ├── indexer.py    # Codebase → ChromaDB (+ reindex)
│   │       └── retriever.py  # Semantic search
│   │
│   ├── services/
│   │   ├── github.py         # GitHub API wrapper
│   │   ├── scheduler.py      # APScheduler (always-on background)
│   │   ├── email.py          # Resend digest sender
│   │   └── cache.py          # Upstash Redis
│   │
│   ├── db/
│   │   └── supabase.py       # Supabase client
│   │
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   │
│   ├── ml_training/          # Run once via GitHub Actions to train
│   │   ├── collect_data.py   # Fetch GitHub Archive data
│   │   ├── train.py          # Train + evaluate classifier
│   │   └── commit_classifier.pkl  # Committed to repo after training
│   │
│   └── Dockerfile
│
├── frontend/
│   ├── middleware.ts              # ← AUTH GUARD (runs on Edge, before any page)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Landing page (public)
│   │   ├── login/page.tsx         # Login page (public)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Protected
│   │   ├── repo/
│   │   │   └── [id]/page.tsx      # Protected
│   │   └── settings/
│   │       └── page.tsx           # Protected
│   │
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── CommitCard.tsx         # Animated commit with ML badge
│   │   ├── RepoHealthScore.tsx    # Animated radial score
│   │   ├── ActivityFeed.tsx       # Live WebSocket feed
│   │   ├── TypeBadge.tsx          # bug_fix / feature / breaking badges
│   │   ├── ReindexButton.tsx      # Manual re-index trigger with progress
│   │   └── TerminalLoader.tsx     # Indexing progress animation
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

> All variables go in **Koyeb dashboard** (backend) and **Vercel dashboard** (frontend). Never in code. Never committed to git.

```env
# .env.example — copy this, fill values, add to platform dashboards

# LLM (both free tiers — sign up at aistudio.google.com and console.groq.com)
GEMINI_API_KEY=
GROQ_API_KEY=

# GitHub PAT (free — github.com/settings/tokens → classic → public_repo scope)
# Needed for: posting comments + higher rate limits (5000/hr vs 60/hr)
GITHUB_TOKEN=

# Supabase (free — supabase.com → new project)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Upstash Redis (free — console.upstash.com → create database → REST API)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Resend (free — resend.com → API Keys)
RESEND_API_KEY=
FROM_EMAIL=noreply@yourdomain.is-a.dev

# App config
JWT_SECRET_KEY=generate_64_char_random_string
FRONTEND_URL=https://your-app.vercel.app
CHROMA_PERSIST_DIR=/app/chroma_db   # Koyeb persistent disk path
ENVIRONMENT=production
```

---

## 5. Core Code

### 5.1 `main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.v1 import auth, repos, commits, ws
from core.ml.classifier import load_classifier
from services.scheduler import start_scheduler
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_classifier()          # Load .pkl model into memory
    await start_scheduler()    # Start background GitHub polling
    yield

app = FastAPI(title="RepoMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,    prefix="/api/v1/auth")
app.include_router(repos.router,   prefix="/api/v1/repos")
app.include_router(commits.router, prefix="/api/v1/commits")
app.include_router(ws.router,      prefix="/api/v1")

@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

### 5.2 `frontend/middleware.ts` — Auth Guard (THE FIX)

> This is the correct way to protect routes in Next.js. It runs on the **Edge runtime before any page loads** — the user never sees a protected page without a valid session. This is why your previous project had the issue: it checked auth client-side (after page load) instead of at the middleware level.

```typescript
// frontend/middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Pages that don't require auth
const PUBLIC_ROUTES = ["/", "/login", "/api/v1/health"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired (keeps user logged in)
  const { data: { session } } = await supabase.auth.getSession()

  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    req.nextUrl.pathname === route ||
    req.nextUrl.pathname.startsWith("/login")
  )

  // No session + trying to access protected route → redirect to login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Has session + trying to access login → redirect to dashboard
  if (session && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

// Apply middleware to ALL routes except Next.js internals and static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
}
```

**Why the previous project broke:** Without middleware, Next.js renders pages on the client. When a user visits `/dashboard` directly, the JavaScript loads first, renders the page, *then* calls `useEffect` to check auth. There's a full render cycle where the page is visible. Middleware intercepts at the network level — before any HTML is sent — so a unauthenticated user never receives the protected page at all.

### 5.3 `api/v1/repos.py` — Manual Re-index Endpoint

```python
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from core.security import get_current_user
from core.rag.indexer import index_repository, clear_repo_index
from db.supabase import supabase
from services.cache import invalidate_repo_cache

router = APIRouter()

@router.post("/{repo_id}/reindex")
async def trigger_reindex(
    repo_id: str,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user)
):
    """
    Manually trigger a full re-index of the codebase.
    Use this when: repo has major refactor, new branches merged,
    or embeddings feel stale.
    Runs in background — returns immediately, progress via WebSocket.
    """
    # Verify repo belongs to this user
    repo = supabase.table("repositories")\
        .select("*")\
        .eq("id", repo_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()

    if not repo.data:
        raise HTTPException(404, "Repo not found")

    # Mark as re-indexing
    supabase.table("repositories")\
        .update({"is_indexed": False, "reindex_requested_at": "now()"})\
        .eq("id", repo_id)\
        .execute()

    # Invalidate all cached queries for this repo
    await invalidate_repo_cache(repo_id)

    # Run in background — user sees progress via WebSocket
    background_tasks.add_task(
        _run_reindex,
        repo_id=repo_id,
        owner=repo.data["owner"],
        repo_name=repo.data["repo_name"]
    )

    return {"status": "reindex_started", "message": "Watch the activity feed for progress"}

async def _run_reindex(repo_id: str, owner: str, repo_name: str):
    """Background task: clear old index, rebuild from scratch."""
    try:
        # Clear old ChromaDB collection for this repo
        await clear_repo_index(repo_id)

        # Re-index with progress callback pushing to WebSocket
        from services.websocket_manager import ws_manager

        async def progress_callback(files_done: int, current_file: str):
            await ws_manager.broadcast_to_repo(repo_id, {
                "type": "reindex_progress",
                "files_done": files_done,
                "current_file": current_file
            })

        files_indexed = await index_repository(
            repo_id=repo_id,
            owner=owner,
            repo_name=repo_name,
            progress_callback=progress_callback
        )

        # Mark complete
        supabase.table("repositories")\
            .update({"is_indexed": True, "last_indexed_at": "now()"})\
            .eq("id", repo_id)\
            .execute()

        await ws_manager.broadcast_to_repo(repo_id, {
            "type": "reindex_complete",
            "files_indexed": files_indexed,
            "message": f"✓ Re-indexed {files_indexed} files"
        })

    except Exception as e:
        await ws_manager.broadcast_to_repo(repo_id, {
            "type": "reindex_error",
            "message": f"Re-index failed: {str(e)}"
        })
```

### 5.4 `core/ml/classifier.py`

```python
import joblib
import numpy as np
from pathlib import Path

_model = None

def load_classifier():
    global _model
    model_path = Path("ml_training/commit_classifier.pkl")
    if model_path.exists():
        _model = joblib.load(model_path)
        print(f"✓ ML classifier loaded")
    else:
        print("⚠ No trained model found. Run ml_training/train.py first.")

def classify_commit(message: str, additions: int, deletions: int,
                    files_changed: int) -> dict:
    if _model is None:
        return {"type": "unknown", "confidence": 0.0}

    features = {
        "message": message,
        "additions": additions,
        "deletions": deletions,
        "files_changed": files_changed,
        "has_breaking": any(kw in message.upper()
                           for kw in ["BREAKING", "DEPRECAT", "REMOVED"]),
    }

    proba = _model.predict_proba([features])[0]
    classes = _model.classes_
    top_idx = np.argmax(proba)

    return {
        "type": classes[top_idx],
        "confidence": round(float(proba[top_idx]), 3),
        "scores": {c: round(float(p), 3) for c, p in zip(classes, proba)},
        "is_breaking": classes[top_idx] == "breaking_change" or features["has_breaking"]
    }
```

### 5.5 `core/agent/tools.py`

```python
from langchain.tools import tool
from services.github import gh_client
from core.rag.retriever import search_codebase
from db.supabase import supabase

@tool
def get_commit_diff(sha: str, repo_full_name: str) -> str:
    """Get the full code diff for a specific commit SHA."""
    try:
        repo = gh_client().get_repo(repo_full_name)
        commit = repo.get_commit(sha)
        diffs = []
        for file in commit.files[:10]:  # Cap at 10 files
            diffs.append(f"File: {file.filename}\n"
                        f"Changes: +{file.additions} -{file.deletions}\n"
                        f"Patch:\n{file.patch or '(binary)'}\n")
        return "\n---\n".join(diffs)
    except Exception as e:
        return f"Error fetching diff: {e}"

@tool
def search_codebase_semantics(query: str, repo_id: str) -> str:
    """Search the repo codebase using semantic similarity."""
    results = search_codebase(query, repo_id, k=4)
    if not results:
        return "No relevant code found."
    output = []
    for doc in results:
        output.append(f"File: {doc.metadata['file_path']}\n"
                     f"Function: {doc.metadata.get('function_name', 'module-level')}\n"
                     f"Code:\n{doc.page_content}")
    return "\n---\n".join(output)

@tool
def find_related_issues(keywords: list[str], repo_full_name: str) -> str:
    """Find open GitHub issues related to given keywords."""
    try:
        repo = gh_client().get_repo(repo_full_name)
        issues = repo.get_issues(state="open")
        related = []
        for issue in list(issues)[:50]:
            text = f"{issue.title} {issue.body or ''}".lower()
            if any(kw.lower() in text for kw in keywords):
                related.append(f"Issue #{issue.number}: {issue.title}\n"
                               f"URL: {issue.html_url}")
        return "\n\n".join(related) if related else "No related issues found."
    except Exception as e:
        return f"Error: {e}"

@tool
def post_github_comment(repo_full_name: str, issue_number: int, body: str) -> str:
    """Post a comment on a GitHub issue or PR."""
    try:
        repo = gh_client().get_repo(repo_full_name)
        issue = repo.get_issue(issue_number)
        comment = issue.create_comment(
            f"🤖 **RepoMind AI Agent**\n\n{body}\n\n"
            f"*This comment was automatically generated by RepoMind.*"
        )
        return f"Comment posted: {comment.html_url}"
    except Exception as e:
        return f"Error posting comment: {e}"
```

### 5.6 `core/agent/pipeline.py`

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.agents import create_react_agent, AgentExecutor
from langchain import hub
from core.agent.tools import (get_commit_diff, search_codebase_semantics,
                               find_related_issues, post_github_comment)
from core.ml.classifier import classify_commit
from core.config import settings

TOOLS = [get_commit_diff, search_codebase_semantics,
         find_related_issues, post_github_comment]

AGENT_PROMPT = """You are RepoMind, an intelligent GitHub repository analyst.

You receive information about a new commit and must:
1. Understand what changed and why it matters
2. Find any related open issues this commit might fix or affect  
3. Post a helpful comment if you find a strong connection (confidence > 0.8)
4. Provide a concise structured summary

Always cite specific file names and issue numbers.
If you cannot determine impact confidently, say so honestly.
Never post a comment unless you are highly confident it is relevant.

{tools}
{tool_names}
{agent_scratchpad}"""

def get_llm():
    try:
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.1)
    except Exception:
        return ChatGroq(
            model="llama-3.1-70b-versatile",
            api_key=settings.GROQ_API_KEY,
            temperature=0.1)

async def run_agent_pipeline(commit: dict, repo: dict) -> dict:
    """Full pipeline: classify → agent analyze → structured output"""

    # Step 1: ML classification
    classification = classify_commit(
        message=commit["message"],
        additions=commit.get("additions", 0),
        deletions=commit.get("deletions", 0),
        files_changed=commit.get("files_changed", 0)
    )

    # Step 2: Agent analysis
    llm = get_llm()
    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, TOOLS, prompt)
    executor = AgentExecutor(agent=agent, tools=TOOLS,
                            max_iterations=6, verbose=False)

    agent_input = (
        f"Repository: {repo['owner']}/{repo['repo_name']}\n"
        f"New commit SHA: {commit['sha']}\n"
        f"Commit message: {commit['message']}\n"
        f"ML Classification: {classification['type']} "
        f"(confidence: {classification['confidence']})\n"
        f"Is breaking change: {classification['is_breaking']}\n\n"
        f"Analyze this commit, find related issues, and post a comment "
        f"if highly relevant."
    )

    try:
        result = await executor.ainvoke({"input": agent_input})
        summary = result["output"]
    except Exception as e:
        summary = f"Agent analysis failed: {e}"

    return {
        "sha": commit["sha"],
        "classification": classification,
        "agent_summary": summary,
        "repo_id": repo["id"]
    }
```

### 5.7 `core/rag/indexer.py`

```python
import chromadb
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
from github import Github
from core.config import settings
import ast, re

_embed_model = SentenceTransformer('BAAI/bge-base-en-v1.5')
_chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

CODE_EXTENSIONS = {'.py', '.js', '.ts', '.jsx', '.tsx', '.go', '.java',
                   '.rs', '.cpp', '.c', '.rb', '.php', '.swift'}

class LocalEmbedding:
    def embed_documents(self, texts):
        return _embed_model.encode(texts, show_progress_bar=False).tolist()
    def embed_query(self, text):
        return _embed_model.encode([text])[0].tolist()

def get_collection(repo_id: str):
    return _chroma_client.get_or_create_collection(
        name=f"repo_{repo_id.replace('-', '_')}_code",
        embedding_function=LocalEmbedding()
    )

async def index_repository(repo_id: str, owner: str, repo_name: str,
                           progress_callback=None):
    """Index entire codebase into ChromaDB."""
    g = Github(settings.GITHUB_TOKEN)
    repo = g.get_repo(f"{owner}/{repo_name}")
    collection = get_collection(repo_id)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800, chunk_overlap=150,
        separators=["\nclass ", "\ndef ", "\n\n", "\n"])

    contents = repo.get_contents("")
    files_processed = 0
    all_docs, all_metas, all_ids = [], [], []

    while contents:
        file = contents.pop(0)
        if file.type == "dir":
            contents.extend(repo.get_contents(file.path))
            continue
        ext = "." + file.path.split(".")[-1] if "." in file.path else ""
        if ext not in CODE_EXTENSIONS or file.size > 100_000:
            continue

        try:
            content = file.decoded_content.decode("utf-8", errors="ignore")
            chunks = splitter.split_text(content)
            for i, chunk in enumerate(chunks):
                all_docs.append(chunk)
                all_metas.append({
                    "file_path": file.path,
                    "language": ext.lstrip("."),
                    "repo_id": repo_id,
                    "chunk_index": i
                })
                all_ids.append(f"{repo_id}_{file.sha}_{i}")
            files_processed += 1
            if progress_callback:
                await progress_callback(files_processed, file.path)
        except Exception:
            continue

    # Batch upsert
    batch_size = 100
    for i in range(0, len(all_docs), batch_size):
        collection.upsert(
            documents=all_docs[i:i+batch_size],
            metadatas=all_metas[i:i+batch_size],
            ids=all_ids[i:i+batch_size]
        )

    return files_processed
```

### 5.8 `services/scheduler.py`

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from db.supabase import supabase
from services.github import get_new_commits
from core.agent.pipeline import run_agent_pipeline
from services.email import send_breaking_change_alert
from core.config import settings
import asyncio

scheduler = AsyncIOScheduler()

async def poll_all_repos():
    """Check all monitored repos for new commits."""
    repos = supabase.table("repositories")\
        .select("*")\
        .eq("is_indexed", True)\
        .execute().data

    for repo in repos:
        try:
            new_commits = await get_new_commits(
                owner=repo["owner"],
                repo_name=repo["repo_name"],
                since=repo["last_checked_at"]
            )
            for commit in new_commits:
                result = await run_agent_pipeline(commit, repo)

                # Save to DB
                supabase.table("commits").insert({
                    "repo_id": repo["id"],
                    "sha": result["sha"],
                    "message": commit["message"],
                    "commit_type": result["classification"]["type"],
                    "confidence": result["classification"]["confidence"],
                    "is_breaking": result["classification"]["is_breaking"],
                    "agent_analysis": result["agent_summary"],
                }).execute()

                # Alert on breaking changes
                if result["classification"]["is_breaking"]:
                    await send_breaking_change_alert(repo, commit, result)

            # Update last checked
            supabase.table("repositories")\
                .update({"last_checked_at": "now()"})\
                .eq("id", repo["id"])\
                .execute()

        except Exception as e:
            print(f"Error polling {repo['repo_name']}: {e}")

async def start_scheduler():
    scheduler.add_job(
        poll_all_repos,
        trigger=IntervalTrigger(minutes=30),
        id="poll_repos",
        replace_existing=True
    )
    scheduler.start()
    print("✓ Scheduler started — polling every 30 mins")
```

### 5.9 `ml_training/train.py`

```python
"""
Train the commit classifier.
Run once: python ml_training/train.py
Requires: ml_training/commits_dataset.csv
  columns: message, additions, deletions, files_changed, label
"""
import pandas as pd
import numpy as np
import joblib
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from sklearn.preprocessing import FunctionTransformer
from imblearn.over_sampling import SMOTE
from scipy.sparse import hstack

df = pd.read_csv("ml_training/commits_dataset.csv")

# Features
X_text = df["message"].fillna("")
X_num = df[["additions", "deletions", "files_changed"]].fillna(0).values
y = df["label"]

# TF-IDF on messages
tfidf = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
X_tfidf = tfidf.fit_transform(X_text)

# Combine
import scipy.sparse as sp
X = sp.hstack([X_tfidf, X_num])

# Handle class imbalance
sm = SMOTE(random_state=42)
X_res, y_res = sm.fit_resample(X, y)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X_res, y_res, test_size=0.2, random_state=42)

# Train
clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# Evaluate
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))
print(f"Macro F1: {f1_score(y_test, y_pred, average='macro'):.3f}")

# Save both vectorizer + model
joblib.dump({"tfidf": tfidf, "clf": clf}, "ml_training/commit_classifier.pkl")
print("✓ Model saved to ml_training/commit_classifier.pkl")
```

---

## 6. Frontend UI Stack

### Design Direction
**Terminal-meets-modern.** Dark background (#0a0a0a), monospace accents for code/SHA values, neon green (#00ff88) for healthy/passing states, red (#ff4444) for breaking changes, amber (#ffaa00) for warnings. Clean card grid with subtle glass morphism. Feels like a developer tool, not a generic SaaS.

### Key Animations

```tsx
// ReindexButton.tsx — Manual re-index with live progress
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw } from "lucide-react"

export function ReindexButton({ repoId, onComplete }) {
  const [status, setStatus] = useState<"idle"|"indexing"|"done"|"error">("idle")
  const [progress, setProgress] = useState({ files: 0, current: "" })

  const handleReindex = async () => {
    setStatus("indexing")
    setProgress({ files: 0, current: "Starting..." })

    // Trigger backend reindex
    await fetch(`/api/v1/repos/${repoId}/reindex`, { method: "POST" })

    // Progress comes via WebSocket — handled by ActivityFeed
    // Listen for reindex_complete event
    const handler = (event) => {
      if (event.type === "reindex_progress") {
        setProgress({ files: event.files_done, current: event.current_file })
      }
      if (event.type === "reindex_complete") {
        setStatus("done")
        onComplete?.()
        setTimeout(() => setStatus("idle"), 3000)
      }
      if (event.type === "reindex_error") {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 3000)
      }
    }
    window.addEventListener("repomind_ws_event", handler)
    return () => window.removeEventListener("repomind_ws_event", handler)
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleReindex}
        disabled={status === "indexing"}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          border transition-all ${
            status === "idle"     ? "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200" :
            status === "indexing" ? "border-amber-500/50 text-amber-400 cursor-not-allowed" :
            status === "done"     ? "border-green-500/50 text-green-400" :
                                    "border-red-500/50 text-red-400"
          }`}
      >
        <motion.div
          animate={status === "indexing" ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: status === "indexing" ? Infinity : 0, ease: "linear" }}
        >
          <RefreshCw size={14} />
        </motion.div>
        {status === "idle"     && "Re-index codebase"}
        {status === "indexing" && "Indexing..."}
        {status === "done"     && "✓ Complete"}
        {status === "error"    && "Failed — retry"}
      </motion.button>

      <AnimatePresence>
        {status === "indexing" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs font-mono text-zinc-500"
          >
            <span className="text-amber-400">{progress.files}</span> files indexed
            <span className="block truncate text-zinc-600">{progress.current}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

```tsx
// CommitCard.tsx — Framer Motion stagger
import { motion } from "framer-motion"

export function CommitCard({ commit, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4
                 hover:border-zinc-600 transition-colors"
    >
      <div className="flex items-center gap-3">
        <TypeBadge type={commit.commit_type} />
        <code className="text-zinc-400 text-xs font-mono">
          {commit.sha.slice(0, 7)}
        </code>
        {commit.is_breaking && (
          <span className="text-xs bg-red-500/20 text-red-400
                           border border-red-500/30 rounded px-2 py-0.5">
            ⚠ BREAKING
          </span>
        )}
      </div>
      <p className="text-zinc-200 text-sm mt-2">{commit.message}</p>
      <p className="text-zinc-500 text-xs mt-1">
        Confidence: {(commit.confidence * 100).toFixed(0)}%
      </p>
    </motion.div>
  )
}

// RepoHealthScore.tsx — GSAP radial animation
import { useEffect, useRef } from "react"
import { gsap } from "gsap"

export function HealthScore({ score }) {
  const circleRef = useRef(null)
  const circumference = 2 * Math.PI * 45

  useEffect(() => {
    gsap.to(circleRef.current, {
      strokeDashoffset: circumference - (score / 100) * circumference,
      duration: 1.5,
      ease: "power2.out"
    })
  }, [score])

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="45" fill="none"
              stroke="#27272a" strokeWidth="8"/>
      <circle ref={circleRef} cx="60" cy="60" r="45" fill="none"
              stroke="#00ff88" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"/>
      <text x="60" y="65" textAnchor="middle"
            fill="#fff" fontSize="20" fontWeight="bold">
        {score}
      </text>
    </svg>
  )
}

// ActivityFeed.tsx — Live WebSocket
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function ActivityFeed() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/ws/feed?token=${token}`)

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data)
      setEvents(prev => [event, ...prev].slice(0, 50))
    }
    return () => ws.close()
  }, [])

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {events.map((event, i) => (
          <motion.div key={event.id}
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-zinc-400 font-mono border-l-2
                       border-green-500/50 pl-3 py-1"
          >
            <span className="text-green-400">▶</span> {event.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

---

## 7. Deployment

### Backend → Koyeb
```bash
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Koyeb settings:
# Build: Docker
# Port: 8000
# Persistent disk: /app/chroma_db (1GB — for ChromaDB)
# Add all env vars in Koyeb dashboard
```

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Add env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-app.koyeb.app
# NEXT_PUBLIC_WS_URL=wss://your-app.koyeb.app
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### GitHub Actions (`.github/workflows/deploy.yml`)
```yaml
name: CI/CD
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with: { python-version: '3.11' }
      - run: pip install -r backend/requirements.txt
      - run: cd backend && python -m pytest tests/ -v --tb=short
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Redeploy Koyeb
        run: |
          curl -X POST \
          -H "Authorization: Bearer ${{ secrets.KOYEB_API_KEY }}" \
          https://app.koyeb.com/v1/services/${{ secrets.KOYEB_SERVICE_ID }}/redeploy
```

---

## 8. Build Checklist — Week by Week

### Week 1 — ML Model + Backend Foundation
```
□ Collect GitHub commits dataset (GitHub Archive or manual scraping)
□ Train commit classifier — get to 85%+ accuracy
□ FastAPI skeleton + all routes stubbed
□ Supabase schema applied
□ GitHub API integration working (PAT configured)
□ ChromaDB indexer working on a test repo
□ /health endpoint deployed to Koyeb
□ UptimeRobot pinging /health every 5 mins
```

### Week 2 — Agent + Monitoring
```
□ All 5 LangChain tools working individually (test each in isolation)
□ ReAct agent running end-to-end on a real commit
□ APScheduler polling working (verify it runs when browser is closed)
□ WebSocket endpoint pushing events
□ Manual reindex endpoint working
□ Email digest sending via Resend
□ Full pipeline: repo added → indexed → commit detected → analyzed → saved
```

### Week 3 — Frontend
```
□ middleware.ts protecting ALL routes except / and /login
□ Google OAuth login via Supabase working
□ Landing page with GSAP scroll animations
□ Dashboard — repo cards, add repo flow
□ Repo detail page — commit feed with ML badges
□ Live activity feed (WebSocket)
□ ReindexButton with progress animation
□ Health score with GSAP radial animation
□ Mobile responsive
□ Test: visit /dashboard without login → should redirect to /login instantly
```

### Week 4 — Polish + Deploy
```
□ Error handling and loading skeleton screens everywhere
□ README with architecture diagram + demo GIF
□ ML model accuracy metrics documented in README
□ Custom domain via is-a.dev
□ GitHub Actions CI/CD pipeline active
□ Demo recorded pointing at a real OSS repo (fastapi/fastapi is perfect)
□ Record 2-min demo video for portfolio/resume
```

---

## 9. Ideas to Make It More Interesting

These additions take 1–3 days each and significantly raise the impressiveness level:

**Commit Risk Score** — beyond just type classification, calculate a 0-100 risk score per commit based on: files changed (core files = high risk), lines deleted (big deletions = risky), test coverage change (less tests = red flag), time since last change to that file (rarely touched file being modified = risk). Display as a color-coded number on each commit card. Something no other tool does.

**Bus Factor Analyzer** — scan all commits and calculate which files are only ever touched by one person. Flag these as "bus factor risk" — if that person leaves, the codebase suffers. Visual heatmap showing file → contributor concentration. Genuinely useful, genuinely novel.

**Commit Velocity Anomaly Detection** — use a simple moving average to detect when commit frequency spikes or drops abnormally. "This repo usually gets 3 commits/day — today it got 47. Possible crunch or incident." Flag it on the dashboard. Uses basic ML (z-score anomaly detection) which is another ML talking point.

**"What broke this?" Natural Language Search** — text box on the repo page: "When was the auth module last touched?" or "Find the commit that added rate limiting." Uses your existing RAG over commit history. One endpoint, huge demo value.

**Contributor Insights Panel** — per-contributor breakdown: what % of their commits are bug fixes vs features, average confidence score of their commits, most touched files. Feels like a developer analytics product.

**GitHub Trending Monitor** — special mode where instead of monitoring your own repos, you monitor GitHub trending daily. Agent analyzes what's trending in your tech stack and sends a daily "what's new in Python/AI world" digest. Completely different use case, same codebase.

**Start with Commit Risk Score first** — it's 2 days of work, adds a real ML component (weighted scoring), and looks stunning on the UI with a colored badge on every commit.

---

## 10. Interview Talking Points

When asked "tell me about your project" — say this:

> "I built RepoMind, an autonomous AI agent that monitors GitHub repositories. It has four distinct AI layers: a scikit-learn classifier trained on 50k GitHub commits that categorizes changes with 88% accuracy; sentence-transformer embeddings that index the entire codebase for semantic search; a RAG pipeline that lets the agent understand the context of any change; and a LangChain ReAct agent with custom tools that autonomously decides whether to post GitHub comments or trigger alerts. The backend is FastAPI with APScheduler for background monitoring — it runs 24/7 on Koyeb regardless of whether the user has the app open. Everything is deployed free using Koyeb, Vercel, and Supabase."

That answer covers ML, embeddings, RAG, agents, backend, deployment, and system design — every keyword an AI/ML interviewer wants to hear.

---

*MVP Tech Doc v2.0 — RepoMind | Est. build time: 4 weeks*
