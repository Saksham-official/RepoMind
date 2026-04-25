# Phase 09: Knowledge Graph & Context Linking

**Goal**: Create a relational linking system between Issues, PRs, and Commits to enable deep, multi-entity RAG queries.

## Plans

### 09-01: Cross-Entity Linking Logic
- [ ] Create `entity_relationships` table in Supabase.
- [ ] Implement `backend/core/ai/graph_agent.py` to scan commit messages for "fixes #123" or "related to #456" and populate the table.
- [ ] Automatically link PRs to the issues they reference in their descriptions.

### 09-02: Deep RAG Search
- [ ] Update `synthesize_answer` in `contributor_helper.py` to traverse relationships.
- [ ] Example: If a question is about a fix, the agent should find the commit, then find the linked issue, and pull context from both.
- [ ] Enhance the LLM prompt to synthesize information across these linked entities.

### 09-03: Relationship Visualizer
- [ ] Create `frontend/src/components/RelationshipGraph.tsx` — a simple visual representation of linked entities.
- [ ] Add "Linked Entities" section to the Issue and PR detail views.

## UAT Criteria
1. Commits with "fixes #X" are automatically linked to Issue #X in the database.
2. Copilot can answer: "What was the reasoning behind the fix for issue #42?" by pulling context from both the commit analysis and the issue discussion.
3. The dashboard shows a "Links" section on issue cards showing related commits and PRs.
