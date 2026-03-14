# Product Requirements Document
## RepoMind — AI GitHub Repository Intelligence Agent
**Version:** 1.0 | **Date:** March 2026 | **Status:** Active

---

## 1. Executive Summary

RepoMind is an autonomous AI agent that monitors GitHub repositories, understands code changes semantically, classifies commits using a trained ML model, detects breaking changes, connects commits to issues, and takes intelligent actions — without human intervention. Not a notification tool. An intelligence layer on top of GitHub.

**The one-line pitch:** "It doesn't tell you what happened — it tells you what it means and what to do."

---

## 2. Problem

Developers lose hours on repository noise:

| Pain | Reality |
|---|---|
| 50+ commits to review | Takes hours to understand what actually changed |
| Breaking changes | Slip through until production breaks |
| Open issues | Pile up with no connection to commits that fix them |
| PR reviews | Lack context on blast radius of a change |
| Open source maintainers | Can't keep up with contributor activity |

Existing tools (GitHub notifications, Dependabot) only say *what* happened — not *what it means* or *what to do*.

---

## 3. What RepoMind Does

```
User adds repo URL
        ↓
RepoMind indexes entire codebase as embeddings
        ↓
Monitors every 30 mins — commits, issues, PRs
        ↓
ML model classifies each commit (bug/feature/breaking/docs/refactor)
        ↓
LangChain agent understands impact using RAG over codebase
        ↓
Agent connects commits → related open issues automatically
        ↓
Posts intelligent GitHub comments + sends email digest
        ↓
Dashboard shows repo health, risk score, change velocity
```

---

## 4. Target Users

**Primary — Individual Developer:** Tracks dependencies or OSS projects. Wants zero-effort repo intelligence without reading every commit.

**Secondary — Small Team (2–10 devs):** Async awareness of what teammates are doing without context switching.

---

## 5. Features

### Phase 1 — MVP (Weeks 1–4)

**Repo Indexing Engine**
Clone any public GitHub repo, parse all code files into chunks, embed using sentence-transformers (local, free), store in ChromaDB with file + function-level metadata. Incremental re-indexing on new commits — only changed files.

**Commit Classifier (Real ML Model)**
Trained scikit-learn classifier on GitHub commit data. Input: commit message + diff. Output: `{bug_fix, feature, breaking_change, docs, refactor, test}` with confidence scores. Saved as `.pkl`, served via FastAPI. Target accuracy: 88%+. This is a real trained model — not an API call.

**Autonomous LangChain Agent**
ReAct pattern agent with 5 custom tools:
- `get_commit_diff` — fetches actual code diff via GitHub API
- `search_codebase` — semantic search over repo embeddings
- `find_related_issues` — matches commit semantics to open issues
- `analyze_impact` — understands which modules are affected
- `post_github_comment` — takes real action on GitHub

**Monitoring Engine**
APScheduler background job polling every 30 mins. Detects new commits, issues, PRs. Triggers agent pipeline per event. Stores full history in Supabase. **Runs 24/7 on Koyeb — closing the browser never pauses monitoring.** All commits from overnight are analyzed and waiting when user opens the app next morning.

**Manual Re-index**
Button on each repo page. Triggers full re-embedding of codebase from scratch — useful after major refactors, large merges, or if embeddings feel stale. Progress streamed live via WebSocket. Runs in background, never blocks the UI.

**Email Digest**
Daily summary per repo — commit breakdown by type, breaking changes flagged, issue↔commit connections, recommended actions. Sent via Resend. User controls frequency.

**Dashboard**
Add/remove repos, live activity feed via WebSocket, commit timeline with ML classification badges, repo health score, breaking change alerts. Full dark theme with terminal aesthetic.

**Route Auth Protection**
`middleware.ts` on Vercel Edge intercepts every request before page renders. No session = instant redirect to `/login`. No flash of protected content, no client-side bypass. Every protected route is server-enforced.

### Phase 2 (Weeks 5–8)

- Codebase Q&A via RAG ("What does the auth module do?")
- **Commit Risk Score** — 0-100 score per commit based on files touched, deletion ratio, test coverage change
- **Bus Factor Analyzer** — files only one person touches flagged as single-point-of-failure risk
- **Velocity Anomaly Detection** — z-score alert when commit frequency spikes abnormally
- PR intelligence — auto-summarize, flag high-risk file touches
- Private repo support via GitHub OAuth token
- Fine-tuned DistilBERT commit classifier (higher accuracy)

---

## 6. ML Model Specification

**Training Data:** GitHub Archive public dataset — 50,000+ labeled commits using conventional commit tags as ground truth (`feat:`, `fix:`, `BREAKING CHANGE:` etc.)

**Features:** TF-IDF on commit message, diff size (lines added/removed), number of files changed, file type distribution (.py/.js/.md etc.)

**Model:** TF-IDF vectorizer + Random Forest. Fast, interpretable, no GPU needed, runs locally. F1-score reported per class.

**Why this matters for interviews:** You explain feature engineering, class imbalance handling (SMOTE), evaluation metrics, and serving a `.pkl` model via API. That's exactly what ML Engineer roles test.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Repo indexing (avg size) | < 3 minutes |
| Commit analysis latency | < 15 seconds |
| ML classifier inference | < 100ms |
| API response time | < 500ms p95 |
| Poll interval | 30 mins (configurable) |
| Uptime | 99%+ via UptimeRobot |
| Mobile responsive | Yes |

---

## 8. Out of Scope (v1)

- Private repos, GitLab/Bitbucket, team collaboration, payments, mobile app

---

## 9. Success Criteria (Portfolio Target)

- Live deployed demo with real repo being monitored
- ML model with documented accuracy on README
- Clean GitHub repo that an interviewer can read in 10 minutes
- Able to explain every technical decision confidently in interview

---

*PRD v2.0 — RepoMind*
