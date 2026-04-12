# Concerns

## Technical Debt
- **Unit Test Coverage**: Critical lack of automated unit and integration tests across backend and frontend.
- **Error Handling**: Many pipelines fail silently or with generic errors without robust retry logic (planned but implementation needs checking).
- **Mocking**: Heavy reliance on live GitHub App credentials for development; better mocking of GitHub API is needed.

## Security
- **HMAC Verification**: Ensure verification is enforced on *all* webhook events, not just specific ones.
- **Audit Trail**: Ensure `ai_actions` logic captures enough detail for forensics in case of AI hallucinations or destructive actions.

## Performance
- **Prompt Size**: RAG results (15 chunks) might hit context limits or increase latency/cost for large queries.
- **In-process Scheduler**: APScheduler running in the FastAPI process might consume significant resources alongside heavy AI pipelines.

## Missing Features
- **PR Review Pipeline**: Phase 2 feature (not yet fully implemented).
- **Release Assistant**: Phase 2 feature.
- **Advanced Health Scoring**: Logic exists but needs refinement based on real repository data.
- **Collaborator Mentions**: Responder for `@orbiter` mentions is not fully functional.
