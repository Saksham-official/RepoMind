from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

from core.ml.classifier import load_classifier
from api.v1.webhooks import router as webhooks_router
from api.v1.websockets import router as websockets_router
from api.v1.repos import router as repos_router
from api.v1.rag import router as rag_router
from api.v1.copilot import router as copilot_router
from api.v1.analytics import router as analytics_router
from core.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs exactly once when the server boots up
    print("Booting up RepoMind Backend...")
    load_classifier()
    start_scheduler()
    yield
    # This runs when shutting down
    stop_scheduler()
    print("Shutting down gracefully.")

app = FastAPI(title="RepoMind API", version="1.0.0", lifespan=lifespan)

# Mount the webhooks router (available at /webhooks/github)
app.include_router(webhooks_router)

# Mount Routers
app.include_router(websockets_router, prefix="/api/v1")
app.include_router(repos_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")
app.include_router(copilot_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, # Must be False if using wildcard origin
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "message": "RepoMind API is running!"}

# We'll use this temporarily just to test the ML model via an API call
@app.post("/api/v1/test_ml")
async def test_ml(payload: dict):
    from core.ml.classifier import classify_commit
    
    # Default values to 0 if they don't provide them in the request
    message = payload.get("message", "update readme")
    additions = payload.get("additions", 0)
    deletions = payload.get("deletions", 0)
    files_changed = payload.get("files_changed", 1)
    
    return classify_commit(message, additions, deletions, files_changed)
