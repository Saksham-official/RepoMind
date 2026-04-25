# Structure

## Root Directory
- `backend/`: Python-based AI core and API.
- `frontend/`: Next.js dashboard application.
- `.planning/`: GSD workflow state and codebase mapping (current location).
- Documents: `prd.md`, `architecture.md`, `system_design.md`, `MVP_tech_doc.md`.

## Backend Structure
- `backend/api/v1/`: Endpoint definitions for webhooks, copilot chat, and dashboard APIs.
- `backend/core/`: 
    - `ai/`: LangChain agents, RAG logic, and pipeline implementations.
    - `ml/`: Model loading and inference wrappers.
    - `github_client.py`: GitHub App authentication and client management.
    - `sockets.py`: WebSocket management for live updates.
- `backend/ml_training/`: Scripts for data collection and RandomForest training.
- `backend/chroma_db/`: Persistent vector store directory.

## Frontend Structure
- `frontend/src/app/`: Next.js pages and layouts.
- `frontend/src/components/`: Reusable UI elements (Magic UI, Framer Motion).
- `frontend/src/lib/`: API clients and utility functions.
- `frontend/middleware.ts`: Global authentication guard.
