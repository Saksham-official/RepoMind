# Orbiter (RepoMind) - Project Summary

## What is it?
Orbiter is an **Event-driven Autonomous AI Maintainer** for GitHub repositories. It acts as an intelligent assistant that automatically monitors, analyzes, and responds to repository activities in real-time.

## What does it do?
It listens to GitHub events (like Issues opened, PRs submitted, or Commits pushed), processes them using Large Language Models, and takes autonomous actions. Instead of just sending notifications, Orbiter actively writes back to GitHub (e.g., commenting on issues or labeling them) and displays a live audit trail of its actions on a web dashboard.

## Tech Stack
* **Frontend:** Next.js 14 (App Router), deployed on Vercel. Displays a live activity feed.
* **Backend:** FastAPI (Python 3.11), deployed on Koyeb. Handles incoming GitHub webhooks and WebSocket connections.
* **AI & Machine Learning:** LangChain ReAct agents pulling from **Gemini 1.5 Flash** (primary) and **Groq Llama 3** (fallback), along with Scikit-Learn for text classification.
* **Databases & Vector Storage:** 
  * **ChromaDB**: Local vector engine to store code, docs, and issues for semantic search.
  * **Supabase (PostgreSQL)**: Primary relational database for audit trails and logs.
  * **Upstash (Redis)**: State caching (GitHub limits, classification results).

## Key Features
1. **GitHub App Pattern:** Uses modern and secure GitHub App tokens for webhooks, replacing legacy PATs.
2. **AI Action Layer:** Can actively read repository state via RAG (Retrieval-Augmented Generation) and autonomously `POST` or `PATCH` on GitHub.
3. **Live Dashboard Stream:** WebSockets push live AI actions from the FastAPI backend to the Next.js frontend instantly.
