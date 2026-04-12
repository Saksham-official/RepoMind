# Tech Stack

## Core
- **Languages**: Python (Backend), TypeScript (Frontend, Middleware), SQL (Database).
- **Backend Framework**: FastAPI (v0.100+) with Uvicorn server.
- **Frontend Framework**: Next.js 16.2.1 (App Router), React 19.
- **Styling**: Tailwind CSS 4, Framer Motion, GSAP.

## AI & Machine Learning
- **Orchestration**: LangChain.
- **LLMs**: Gemini 1.5 Flash (Primary), Groq Llama (Fallback).
- **Vector DB**: ChromaDB (Local, persistent disk).
- **ML Models**: scikit-learn (RandomForest for event classification).
- **Embeddings**: HuggingFace (bge-base local).

## Infrastructure & DevOps
- **Backend Hosting**: Koyeb (Always-on free tier).
- **Frontend Hosting**: Vercel.
- **Database**: Supabase (PostgreSQL + Auth + Storage).
- **Cache**: Upstash Redis.
- **Background Jobs**: APScheduler (In-process).

## Tools
- **Version Control**: Git (GitHub App based interaction).
- **CI/CD**: GitHub Actions.
- **Package Managers**: pip (Python), npm (Node.js).
