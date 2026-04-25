# Phase 08: Maintainer Copilot & Explainability

**Goal**: Implement the Maintainer Copilot chat interface and expand the explainability of AI decisions.

## Plans

### 08-01: Maintainer Copilot Chat UI
- [ ] Create `frontend/src/components/CopilotChat.tsx` — a floating, glassmorphism-styled chat interface.
- [ ] Implement `api/v1/copilot/chat` endpoint (if not already fully functional) to handle conversational RAG.
- [ ] Add "Suggested Questions" based on repo health (e.g., "How can I improve my health score?").

### 08-02: Explainability Deep Dive
- [ ] Expand `ActionCard.tsx` to include a "View Reasoning" modal.
- [ ] Visualize the decision tree or confidence scores in a premium, animated chart (using `framer-motion`).
- [ ] Link AI decisions to the specific "Teach Rules" or context chunks that influenced them.

### 08-03: Strategic Insights Digest
- [ ] Implement a `backend/core/ai/digest_agent.py` to run weekly (simulated) and identify bottlenecks.
- [ ] Add a "Strategic Insights" section to the dashboard sidebar/main view.

## UAT Criteria
1. Clicking the Copilot icon opens a chat window that responds with repository-specific knowledge.
2. Clicking "View Reasoning" on an action card shows the exact confidence scores and logic used.
3. The dashboard displays at least one "Strategic Insight" (e.g., "High PR churn in backend module").
