# PROJECT: RepoMind (Orbiter)

## What This Is
RepoMind (codename Orbiter) is an autonomous AI maintainer system. It acts as a real-time event-driven agent that monitors GitHub repositories via webhooks, classifies events (issues, PRs, commits), and takes automated actions such as triage, duplicate detection, and contributor assistance. It features a live dashboard for real-time activity monitoring.

## Core Value
The system provides "zero-touch" maintenance for GitHub repositories, ensuring every issue is triaged and every contributor is assisted instantly, while maintaining a high-fidelity audit trail for maintainers.

## Context
- **Current State**: Core infrastructure (Phase 1 & 2) is largely in place. The system can triage issues, assist contributors, and monitor commits.
- **Pain Points**: Need for deeper learning from maintainers, contributor engagement tracking, and transparent decision-making.
- **Goals**: Implement Phase 3 advanced intelligence: Teach Mode, Contributor Journey Tracking, Explainable Decisions, and Maintainer Copilot Chat.

## Requirements

### Validated
- ✓ **INFRA-01**: FastAPI backend with webhook verification logic
- ✓ **INFRA-02**: GitHub App integration with installation-level auth
- ✓ **AI-01**: Local ML classification of issues/commits (RandomForest)
- ✓ **AI-02**: RAG pipeline for documentation and issue search via ChromaDB
- ✓ **UI-01**: Next.js dashboard with repository overview
- ✓ **AI-ADV-01**: Teach Mode (Learning from maintainer corrections)
- ✓ **AI-ADV-02**: Contributor Journey Tracking (Milestones)
- ✓ **AI-ADV-03**: Explainable Decisions (Reasoning in dashboard)
- ✓ **AI-ADV-04**: Maintainer Copilot Chat (Core logic & RAG)
- ✓ **UI-POLISH-01**: ReactBits animations and premium aesthetic

### Active
- ✓ **FEAT-PR-01**: PR Review Pipeline (Automated code reviews) [Phase 05]
- ✓ **FEAT-MENT-01**: Command-capable mentions (@orbiter /label etc) [Phase 05]
- ✓ **UI-FIX-01**: Dashboard Reliability (WebSocket heartbeat & health UI) [Phase 05]
- ✓ **OPS-CLEAN-02**: Final repository hygiene (Removing unused scripts & schema verification) [Phase 05]
- ✓ **FEAT-ENGAGE-02**: Conversation Memory (Context-aware responses) [Phase 07]
- ✓ **FEAT-DIGEST-01**: Strategic Maintenance Digest (Burnout & bottleneck alerts) [Phase 06]
- ✓ **FEAT-GRAPH-01**: Cross-Entity Linking (Link Issues -> Commits -> PRs in database) [Phase 09]
- ✓ **FEAT-GRAPH-02**: Deep RAG Search (Traverse links to answer multi-entity questions) [Phase 09]
- ✓ **FEAT-GRAPH-UI**: Relationship Visualizer (Show entity links in dashboard) [Phase 09]

### Out of Scope
- **OPS-CI-DYN**: Dynamic code execution/sandboxed tests for user code (Security boundary).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual Code Control | User requested no direct commits to source code without approval. | Process Enforced |
| ReactBits Animations | User specifically targeted ReactBits for visual excellence. | Approved |
| Phase 2 Priority | Features like PR Review and Release Assistant are the next major milestones. | Approved |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
---
*Last updated: 2026-04-25 after Milestone v4.1 completion*
