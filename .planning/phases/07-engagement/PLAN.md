# Phase 07: Proactive Engagement

**Goal**: Detect and respond to questions in issue/PR comments from any user, ensuring multi-user interaction.

## Plans

### 07-01: Proactive Question Detection
- [ ] Rename `handle_mention` to `handle_comment` in `backend/core/ai/mention_responder.py`.
- [ ] Implement `is_question` utility to detect interrogative intent (e.g., "?", "how", "what", "can you").
- [ ] Update `backend/api/v1/webhooks.py` to call `handle_comment` for all new issue comments.
- [ ] Add loop prevention: ensure Orbiter does not respond to its own comments or other bots.

### 07-02: Multi-User Thread Context
- [ ] Update RAG prompt to acknowledge the specific user who asked the question.
- [ ] (Optional) Store recent thread history in memory to allow follow-up questions.
- [ ] Verify that Orbiter responds to "other users" (non-reporters) on existing issues.

## UAT Criteria
1. A user (not the issue creator) comments "How do I run this locally?" on an existing issue.
2. Orbiter detects the question and provides a RAG-based answer.
3. Orbiter ignores comments that are just status updates or do not contain questions/mentions.
