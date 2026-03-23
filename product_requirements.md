# Product Requirements Document (PRD)

## 1. Executive Summary
RepoMind is an autonomous AI agent that monitors GitHub repositories. It understands code changes semantically, classifies commits using a trained ML model, detects breaking changes, and connects commits to open issues without human intervention.

## 2. Problem Statement
Developers and maintainers lose hours trying to understand repository activity. Existing tools only report *what* happened (e.g., standard GitHub notifications) but fail to explain *what it means* or *what actions to take*.

## 3. Target Users
- **Primary:** Individual developers tracking dependencies or Open Source Software (OSS) projects.
- **Secondary:** Small teams (2–10 developers) needing asynchronous awareness of teammate activities.

## 4. Key Features
### Phase 1: MVP (Weeks 1-4)
- **Repo Indexing Engine:** Clones public GitHub repos, parses code into chunks, embeds via `BAAI/bge-base-en-v1.5`, and stores in ChromaDB.
- **Commit Classifier:** A trained Random Forest ML model to classify commits (bug fix, feature, breaking change, etc.) with 88%+ accuracy.
- **Autonomous LangChain Agent:** Uses ReAct pattern with access to tools (`get_commit_diff`, `search_codebase`, `find_related_issues`, `analyze_impact`, `post_github_comment`).
- **Monitoring Engine:** 24/7 background job (every 30 mins) via APScheduler to detect new commits/issues and trigger the agent.
- **Email Digest:** Daily/weekly summaries via Resend outlining commit breakdowns, breaking changes, and connected issues.
- **Dashboard:** Activity feeds, timeline, health score, and manual re-index capabilities.
- **Auth Guard:** Next.js Edge middleware enforcing server-side route protection.

### Phase 2 (Future)
- Codebase Q&A via RAG.
- Commit Risk Score and Bus Factor Analyzer.
- Private repository support via GitHub OAuth.
- Velocity Anomaly Detection.

## 5. Non-Functional Requirements
- Indexing latency: < 3 mins.
- Commit analysis latency: < 15 seconds.
- Model Inference: < 100ms.
- API response: < 500ms p95.

## 6. Out of Scope for MVP
- Private repos, GitLab/Bitbucket, team collaboration features, mobile app.
