import joblib
import numpy as np
from pathlib import Path
import os

_model = None
_tfidf = None

def load_classifier():
    """Loads the serialized TF-IDF vectorizer and Random Forest model into memory."""
    global _model, _tfidf
    
    # We navigate to where we just saved the .pkl file
    model_path = Path(os.path.dirname(__file__)).parent.parent / "ml_training" / "commit_classifier.pkl"
    
    if model_path.exists():
        artifacts = joblib.load(model_path)
        _model = artifacts["clf"]
        _tfidf = artifacts["tfidf"]
        print("[OK] ML commit classifier loaded successfully into memory.")
    else:
        print(f"[WARNING] Warning: No trained model found at {model_path}.")

def classify_commit(message: str, additions: int, deletions: int, files_changed: int) -> dict:
    """Passes commit data through the ML model to receive a predicted label and confidence."""
    if _model is None or _tfidf is None:
        return {"type": "unknown", "confidence": 0.0, "is_breaking": False}

    # Extract boolean feature just like we did during training
    msg_lower = message.lower()
    has_breaking = any(kw in msg_lower for kw in ["breaking change", "breaking:", "removed", "deprecated"])

    # Transform message using the same TF-IDF vectorizer from training
    X_tfidf = _tfidf.transform([message])
    
    # Format the numeric features (must be 2D array: 1 row, 3 columns)
    X_num = np.array([[additions, deletions, files_changed]])
    
    # Combine sparse NLP matrix with numeric features
    import scipy.sparse as sp
    X = sp.hstack([X_tfidf, X_num])

    # Get prediction probabilities
    proba = _model.predict_proba(X)[0]
    classes = _model.classes_
    top_idx = np.argmax(proba)

    # Resolve specific label
    predicted_type = classes[top_idx]
    
    # A commit is breaking if the ML labeled it so, OR if our explicit keyword check fired
    is_breaking = (predicted_type == "breaking_change") or has_breaking
    
    return {
        "type": predicted_type,
        "confidence": round(float(proba[top_idx]), 3),
        "scores": {c: round(float(p), 3) for c, p in zip(classes, proba)},
        "is_breaking": bool(is_breaking)
    }
