# Phase 04 Plan: UI Polish

## Goal
Integrate premium animations, micro-interactions, and enhance the overall dashboard aesthetic to a modern, dark-mode, Magic UI/ReactBits-inspired design.

## Plans

### 04-01: Dashboard Aesthetic Refresh
**Goal:** Enhance the global CSS and layout for a premium dark-mode feel.
**Requirements:**
1. Update `globals.css` to refine the dark mode color palette (e.g., deep charcoal, glassmorphism effects, crisp borders).
2. Refine typography using a modern font (e.g., Inter or Outfit) with appropriate letter spacing.
3. Update `Navbar.tsx` and main layout containers to use frosted glass effects (`backdrop-blur`) and cleaner borders.

### 04-02: Animation & Micro-interactions
**Goal:** Introduce fluid animations and state transitions to the UI.
**Requirements:**
1. Use `framer-motion` to add entry animations to Dashboard cards and Repo detail views.
2. Add hover effects (e.g., subtle scale up, glow, border color transitions) to `ActionCard`, `IssueTriageCard`, and `CommitCard`.
3. Ensure smooth text-reveal transitions where appropriate.
