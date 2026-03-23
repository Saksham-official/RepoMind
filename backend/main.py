from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.ml.classifier import load_classifier

@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs exactly once when the server boots up
    print("Booting up RepoMind Backend...")
    load_classifier()
    yield
    # This runs when shutting down
    print("Shutting down gracefully.")

app = FastAPI(title="RepoMind API", version="1.0.0", lifespan=lifespan)

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Vercel URL
    allow_credentials=True, 
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
