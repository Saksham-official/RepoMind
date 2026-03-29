# Information Architecture

## 1. Site Map & Routing
Orbiter's frontend relies on Next.js 14 App Router, heavily protected by Edge Middleware for authentication gating.

- **`/` (Public)**: Landing page outlining product features, value propositions, and live demo metrics.
- **`/login` (Public)**: Authentication page via Supabase (Google OAuth + Email).
- **`/dashboard` (Protected)**: Main user control panel.
  - Lists monitored repositories configured by the GitHub App.
  - Quick insights / aggregates.
- **`/repo/[id]` (Protected)**: Detail view for a specific repository.
  - **Audit Logs / AI Actions**: Real-time display representing what the AI maintainer has done and *why* (via the expandable `ActionCard`).
  - **Issue Triage Log (`/repo/[id]/issues`)**: Dedicated viewer for classified issues and duplication detections.
  - **Commit Timeline (`/repo/[id]/commits`)**: Historical timeline mapping commit intelligence, ML badges, and repo health impacts.
- **`/settings` (Protected)**: User configurations.
  - Manage email digest frequency.
  - Adjust notification preferences for breaking issues.

## 2. Frontend Component Hierarchy
- **Global Layout**
  - **Header / Nav**
  - **Main Content Area**
    - `ActionCard` (Showcases agent decisions, ML confidence metrics, and expandable reasoning logs).
    - `CommitCard` (Animated timeline details).
    - `IssueTriageCard` (Issue type breakdown, duplicate link referencing).
    - `ActivityFeed` (WebSocket listener for real-time live events).
    - `TypeBadge` (Consistent semantic labeling for features, bugs, questions).
    - `RepoHealthScore` (GSAP powered radial chart determining project health).

## 3. Data Flow
- Clients fetch static data from Supabase directly via the Next.js frontend or backend endpoints.
- Fast updates and ongoing processes post payload messages instantly via the `ActivityFeed` over WebSockets (e.g. `question_answered`, `issue_triaged`).
