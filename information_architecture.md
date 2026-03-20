# Information Architecture

## 1. Site Map & Routing
The frontend is built with Next.js 14 App Router, featuring an Edge Middleware for strict route protection.

- **`/` (Public)**: Landing page outlining product features and value proposition.
- **`/login` (Public)**: Authentication page via Supabase (Google OAuth + Email).
- **`/dashboard` (Protected)**: Main user control panel.
  - Lists monitored repositories as cards.
  - Highlights high-level aggregate health scores and critical alerts.
  - Input field to add a new GitHub repository URL.
- **`/repo/[id]` (Protected)**: Detail view for a specific repository.
  - **Commit Feed / Timeline**: Displays analyzed commits chronologically with TypeBadge (bug_fix, breaking, feature) and confidence levels.
  - **Activity Feed**: Real-time WebSocket terminal-style log of agent activities.
  - **Repo Health Score**: Radial GSAP-animated score indicating overall repository health.
  - **Re-index Button**: Triggers a manual ChromaDB re-index with an animated progress bar.
- **`/settings` (Protected)**: User preferences.
  - Manage email digest frequency (immediate, daily, weekly, off) and breaking change alerts.

## 2. Frontend Component Hierarchy
- `Layout` (Global App Layout)
  - `Header / Nav` (Auth state, User Profile)
  - `Main Content Area`
    - `RepoCard` (List View)
    - `CommitCard` (Animated via Framer Motion)
    - `TypeBadge` (Visual indicator for ML classification)
    - `RepoHealthScore` (GSAP powered radial chart)
    - `ActivityFeed` (WebSocket listener for real-time events)
    - `ReindexButton` (Manual trigger with dynamic progress state)
    - `TerminalLoader` (Visual feedback during codebase indexing)

## 3. Data Flow in UI
- Real-time updates push via WebSockets (e.g., `commit_analyzed`, `reindex_progress`, `issue_linked`).
- Client state minimal; relies heavily on backend push events and direct DB fetches on load.
