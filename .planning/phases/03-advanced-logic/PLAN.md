# Phase 03 Plan: Advanced Logic

## Plans

### 03-01: Core Backend Logic for Advanced Features
Status: Complete
(Implemented in a previous session. Handled Teach Mode, Contributor Journey, Explainable Decisions database schemas and endpoints.)

### 03-02: Real RAG integration for Copilot Chat
Status: Pending
**Goal:** Implement real Retrieval-Augmented Generation (RAG) over repository data.
**Requirements:**
1. Connect `copilot_chat` to the database to fetch real `ai_actions`, `contributor_journeys`, and repository events.
2. Formulate context from this data based on the user's query.
3. Pass the context to the LLM (or mock an advanced response for now if no LLM is connected) returning dynamic data rather than hard-coded mock responses.
**Steps:**
- Update `backend/api/v1/copilot.py` to accept DB session.
- Query tables for recent AI decisions, contributor journeys, or PR metrics depending on keywords in the prompt.
- Replace mock logic with a structured RAG-like fetch -> prompt -> response pipeline.
