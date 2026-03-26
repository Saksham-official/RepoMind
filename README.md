# 🛸 Orbiter — AI Maintainer for Open-Source Repos

![Orbiter Header Banner](https://img.shields.io/badge/Status-Actively%20Building-blue?style=for-the-badge&logo=github)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg?style=flat-square&logo=python)
![Next.js 14](https://img.shields.io/badge/next.js-%2014-black.svg?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/fastapi-%200.100+-00a393.svg?style=flat-square&logo=fastapi)

Orbiter is a **real-time event-driven AI system** that acts as an autonomous junior maintainer for your GitHub repositories. 

Designed specifically for open-source maintainers who are overwhelmed with untriaged issues, repetitive questions, and undrafted changelogs, Orbiter installs seamlessly via a **GitHub App**. It listens to webhooks natively and writes back directly to GitHub—labeling queries, catching duplicate issues via ML, answering user setup questions via RAG, and monitoring repo health. 

No polling. No manual interventions. It acts under its own GitHub App identity, scaling effortlessly.

## 🌟 Key Features

### 1. 🤖 Issue Triage Agent (Autonomous)
- **ML Classification**: Under millisecond performance classifying incoming issues as bugs, feature requests, or questions using a custom unified `.pkl` Random Forest model.
- **Duplicate Detection**: Embeds issue text via BAAI/bge-base vectors locally to search Chromadb. Captures semantic repeats. 
- **Owner Suggestion**: Determines context, runs a targeted git-blame, and comments recommending internal users to inspect the issue based on their commit histories.
- **Execution**: Langchain ReAct pipeline evaluates all gathered context and executes live labels, assignments, and API comment postbacks immediately.

### 2. 📝 Contributor Helper (RAG)
- Identifies "setup setup" or common integration questions. 
- Analyzes multiple integrated ChromaDB collections per repo (`docs`, `issues`, and `code`) using Cross-Encoder reranking.
- Outputs detailed, welcoming answers to contributors pointing directly to sections of `CONTRIBUTING.md` or historic pull requests.
- Maps internal documentation gaps natively and suggests updating docs directly.

### 3. 📈 Commit Intelligence Dashboard
- Interactive UI capturing high-level repo health.
- WebSockets update your terminal-style command center dynamically (FastAPI WebSockets).
- Full audit log of all decisions Orbiter took mapped directly against confidence ratios, allowing human intervention debugging seamlessly over time.

## 🏗️ Technical Architecture

Orbiter marries an elegant modern Next.js 14 frontend framework with a high performance Python machine learning event routing monolith.

- **Infrastructure**: Event-driven Webhook pattern (HMAC payload validation).
- **Frontend**: Next.js App Router, Tailwind CSS, Shadcn, Framer Motion, and Magic UI terminal aesthetics. Includes Next.js Middleware guarding authentication.
- **Backend**: FastAPI paired heavily alongside native `APScheduler` loop tracking. Deployed perfectly to Koyeb with continuous persistent block-storage handling ChromaDB.
- **Data Engine**: Supabase (Postgres for schemas + user Auth). Upstash Redis handles heavy request queue caching for 1-hour GitHub Installation Tokens (preventing rate limit throttling natively). 
- **Intelligence**: LangChain, Gemini 1.5 Flash (Primary LLM), Scikit-Learn (TF-IDF vectorizations), and native ChromaDB Vector DB. 

*Read more in our [System Design Doc](./system_design.md).*

## 🚀 Setting Up (Deploy Yourself)

*Because Orbiter acts as a real-time Github App logic responder rather than a static polling bot, it requires public internet connectivity for webhook receipt.*

### 1. Requirements
Ensure you possess Python >3.11, Node.JS >20.x, and a valid Supabase project.

### 2. API & Secrets Registration
- Generate your GitHub App on `github.com/settings/apps/new` granting Write scopes for Issues, Comments, and PR handling. Point the webhook towards your Koyeb external IP (`/webhooks/github`). 
- Maintain your Gemini Studio key locally. 

### 3. Environment Config
Populate `.env` spanning root definitions logic spanning from your private generated OAuth RSA JWT tokens (read more within the MVP documentation parameters). 

### 4. Run Backend Services
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Run Frontend Engine
```bash
cd frontend
npm install
npm run dev
```

## 📚 Further Documentation Guides

| Readme Title | Description |
| ---- | ----------- |
| [Product Requirements (PRD)](./prd.md) | High-level roadmap tracking and use cases. |
| [System Architecture](./architecture.md) | Structural overview charting the exact flow of payloads. |
| [System Design Technicals](./system_design.md) | Granular code logic references tracking the implementation pipelines. |
| [MVP Implementation Plan](./MVP_tech_doc.md) | Timelines specifying Phase 1 scaling. |

---
**Orbiter** built for the modern OSS ecosystem.  
*Open Source. Serverless. Seamless.*
