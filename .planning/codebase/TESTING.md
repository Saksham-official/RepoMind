# Testing

## Current State
- **Unit Tests**: Minimal coverage in the current version of the codebase.
- **ML Testing**: RandomForest evaluation script exists in `ml_training/train.py` using F1-score metrics.
- **Mocking**: `github_client.py` includes logic for using mock tokens when `GITHUB_PRIVATE_KEY` is missing.

## Testing Strategy
- **Manual Verification**: End-to-end testing performed against a "real test repository".
- **API Tests**: `/api/v1/test_ml` endpoint exists for validating model inference without GitHub events.
- **CI Suite**: GitHub Actions configured to run tests on push to `main` (implementation pending or minimal).

## Planned
- Integration tests for full pipeline execution.
- RAG evaluation for answer accuracy.
- Mocking for external services (Redis, Resend).
