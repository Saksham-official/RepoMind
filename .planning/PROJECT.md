# PROJECT: RepoMind (Orbiter)

## What This Is
RepoMind (codename Orbiter) is an autonomous AI maintainer system. It acts as a real-time event-driven agent that monitors GitHub repositories via webhooks, classifies events (issues, PRs, commits), and takes automated actions such as triage, duplicate detection, and contributor assistance. It features a live dashboard for real-time activity monitoring.

## Core Value
The system provides "zero-touch" maintenance for GitHub repositories, ensuring every issue is triaged and every contributor is assisted instantly, while maintaining a high-fidelity audit trail for maintainers.

## Context
- **Current State**: Core infrastructure (FastAPI, Next.js, ChromaDB, ML Classifier) is implemented but facing reliability issues in dashboard synchronization.
- **Pain Points**: Dashboard Activity Feed is not showing real-time updates; overall UI lacks premium aesthetics and animations.
- **Goals**: Resolve real-time visibility issues, implement Phase 2 features (PR Review, Release Assistant, Mention Responder), and polish the frontend with high-end animations (ReactBits style).

## Requirements

### Validated
- ✓ **INFRA-01**: FastAPI backend with webhook verification logic — existing
- ✓ **INFRA-02**: GitHub App integration with installation-level auth — existing
- ✓ **AI-01**: Local ML classification of issues/commits (RandomForest) — existing
- ✓ **AI-02**: RAG pipeline for documentation and issue search via ChromaDB — existing
- ✓ **UI-01**: Next.js dashboard with repository overview — existing

### Active
- [ ] **UI-FIX-01**: Resolve real-time dashboard update issues (WebSocket/Sync)
- [ ] **UI-POLISH-01**: Integrate ReactBits-inspired premium animations and transitions
- [ ] **FEAT-PR-01**: Implement PR Review pipeline (Style, Logic, Context-aware feedback)
- [ ] **FEAT-REL-01**: Implement Release Assistant (Changelog automation, stakeholder notification)
- [ ] **FEAT-MENT-01**: Implement Mention Responder (@orbiter actions: labeling, assigning, triggering)
- [ ] **OPS-CLEAN-01**: Clean up legacy documentation and redundant root-level files

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
*Last updated: 2026-04-12 after initialization*
