# Product Requirements Document
## Orbiter — AI Maintainer for Open-Source Repos
**Version:** 1.0 | **Date:** March 2026 | **Status:** Active

---

## 1. Executive Summary

Orbiter is an autonomous AI system that acts as a junior maintainer for any GitHub repository. It installs as a GitHub App, receives real-time webhook events, and takes intelligent actions — triaging issues, reviewing PRs with inline comments, answering contributor questions, and drafting release changelogs — all without human intervention.

It merges two layers: an **intelligence dashboard** (commit classification, health scores, codebase embeddings from v1) with a new **autonomous action layer** that writes back to GitHub in real time.

**One line:** An AI that does the work of a junior open-source maintainer, 24/7, for free.

---

## 2. Problem

Open-source maintainers are overwhelmed:

| Pain | Scale |
|---|---|
| Unlabeled issues pile up | Average OSS repo: 40+ unreviewed issues |
| PRs sit unreviewed | Contributors wait weeks, then abandon |
| "How do I run this?" asked repeatedly | Same question in 20 different issues |
| Changelogs never written | Releases undocumented, users confused |
| New contributors lost | No guidance, wrong files touched, PRs never merge |

Existing tools handle narrow automation. Nothing combines contextual AI understanding of the codebase with autonomous multi-step action across issues, PRs, docs, and releases.

**GSoC/LFX signal:** This is the exact pain every open-source org feels daily. Building the solution signals you understand their world — not just models.

---

## 3. System Overview

```
GitHub Repo installs Orbiter GitHub App
            ↓
GitHub sends webhook events instantly:
  issues.opened / PR.opened / push / release.created
            ↓
Orbiter FastAPI receives → routes to pipeline
            ↓
┌──────────────────────────────────────────────────────┐
│                 AI MAINTAINER LAYER                   │
│                                                       │
│  Issue Triage      classify → label → assign → reply │
│  PR Reviewer       diff → analyze → inline comments  │
│  Release Assistant merged PRs → draft changelog      │
│  Contributor Help  question → RAG search → answer    │
└──────────────────────────────────────────────────────┘
            ↓
Actions posted back to GitHub (comments, labels, reviews)
            ↓
Dashboard: live audit trail of every AI action + why
```

---

## 4. Target Users

**Primary — Open-Source Maintainer**
Runs a popular repo, drowning in issues and PRs. Wants a first-pass AI that handles triage and initial responses so they can focus on real technical decisions.

**Primary — You (Portfolio)**
GSoC applicant / AI internship seeker. This project demonstrates end-to-end system design, real ML, autonomous agents, and genuine open-source value — the exact combination that impresses mentors and hiring managers.

**Secondary — Small Dev Team**
Internal repos that need automated code review and issue management without paying for GitHub Copilot Enterprise.

---

## 5. Features

### Phase 1 — MVP (Weeks 1–5)

**Issue Triage Agent**
On `issues.opened` webhook: ML classifier determines type (bug / feature / question / duplicate). Agent searches ChromaDB for similar past issues. If duplicate found (similarity > 0.88): references original, suggests closing. Posts contextual first-response comment. Applies GitHub labels automatically. Suggests owner based on who touched related files most recently (git blame analysis).

**Contributor Helper**
On `issues.opened` where type = "question": RAG search over CONTRIBUTING.md, README, docs/, and past resolved issues. LLM synthesizes answer from retrieved context. Posts direct answer as GitHub comment. If question reveals a documentation gap, opens a new issue flagging it. Never leaves a question unanswered.

**Commit Intelligence (from v1)**
ML classifier on every new commit: bug_fix / feature / breaking_change / docs / refactor / test. Confidence scores. Codebase embeddings in ChromaDB. Health score dashboard. Activity feed via WebSocket.

**Dashboard**
Live audit trail: every action Orbiter took, on which issue/PR, with what reasoning. Repo health score. Commit timeline with ML badges. Activity feed. Add/remove repos. Full dark terminal aesthetic.

**GitHub App Webhooks**
Real-time event delivery. No polling. GitHub pushes events to Orbiter the moment they happen. Handles: issues, pull_request, push, release, issue_comment events. HMAC signature verification on every webhook.

### Phase 2 (Weeks 6–9)

**PR Reviewer**
On `pull_request.opened`: fetch diff, run ruff (linter) + bandit (security) on changed files. RAG search for related code context. LLM generates inline review comments mapped to exact diff line numbers. Posts GitHub Review with APPROVE / REQUEST_CHANGES / COMMENT status. Flags breaking changes automatically.

**Release Assistant**
On `release.created` or manual trigger: fetch all PRs merged since last tag. ML-classify each by type. LLM drafts structured changelog grouped by category (breaking / features / fixes / docs). Posts as GitHub Release draft. Maintainer reviews and publishes.

**Duplicate PR Detection**
On `pull_request.opened`: embed PR description + diff summary, search against existing open PRs. Flag near-duplicates before maintainer wastes review time.

**Auto-close Stale Issues**
Issues with no activity in 60 days: Orbiter posts a "is this still relevant?" comment, adds `stale` label. If no response in 7 days: closes with explanation.

### Phase 3 (Advanced Unique Features)

**"Self-Healing" Documentation**
If Orbiter answers the exact same question in 3 different issues via RAG, it automatically generates a PR to update `README.md` or `FAQ.md` with the new information.

**Toxicity & Maintainer Burnout Detection**
Analyze issue comments for aggressive sentiment or maintainer fatigue. Send private dashboard alerts to core maintainers to protect community health.

**"Blast Radius" PR Prediction**
Cross-reference new PRs against all currently open PRs to warn reviewers of potential severe merge conflicts if core files are heavily modified simultaneously.

**Contributor "Expertise" Mapping**
Use `git blame` and ChromaDB to assign new bugs/features to community members who specifically authored those modules, building contributor engagement.

---

## 6. ML Model

**Commit + Issue Classifier (unified model)**
Same architecture serves both commits and issues — they're both short text classification problems.

Training data:
- Commits: 50,000 from GitHub Archive with conventional commit labels
- Issues: 30,000 from public repos with existing labels as ground truth

Features: TF-IDF (ngram 1–2) on text, text length, has_code_block (bool), has_error_traceback (bool), num_links (int)

Model: TF-IDF + Random Forest. Saved as `.pkl`. Inference < 10ms locally.

Target accuracy: 88%+ commits, 85%+ issues.

**Why unified:** One model, two use cases. More training data. Cleaner architecture. Better interview story — "I built a classifier that generalizes across commit messages and issue text."

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Webhook response time | < 200ms (GitHub expects fast ACK) |
| Pipeline processing | < 15 seconds per event |
| ML classifier inference | < 10ms |
| Uptime | 99%+ (UptimeRobot keepalive) |
| Webhook security | HMAC-SHA256 signature verified on every request |
| Auth protection | Next.js middleware on all routes |
| Tracking when app closed | Yes — APScheduler on Koyeb runs 24/7 |
| Deployment cost | ₹0 — 100% free tier |

---

## 8. What This Signals to Recruiters

| Skill | How Orbiter Demonstrates It |
|---|---|
| ML Engineering | Trained real classifier, feature engineering, SMOTE, F1 evaluation |
| AI Engineering | LangChain ReAct agent, RAG pipeline, custom tools, structured LLM output |
| Systems Design | Webhooks, event routing, background tasks, Redis cache, WebSocket |
| Product Thinking | Solves real maintainer pain, not just a tech demo |
| Open Source Fluency | Built for OSS orgs — GSoC mentors personally relate to the problem |
| Backend Engineering | FastAPI, async, Supabase, GitHub App integration |

---

## 9. Out of Scope (v1)

- Private repo support (needs OAuth token per user — Phase 3)
- GitLab / Bitbucket
- Running actual test suites (requires repo-specific CI setup)
- Payments / tiers

---

## 10. Success Criteria

- Live GitHub App installable on any public repo
- Demo: open real issue → Orbiter labels + comments in < 15 seconds
- ML model accuracy documented in README with confusion matrix
- Clean codebase an interviewer can read in 10 minutes
- Can explain every technical decision in depth

---

*PRD v1.0 — Orbiter*
