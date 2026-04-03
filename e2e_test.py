import requests
import json
import hmac
import hashlib
import time
import os

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:8000")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "test-secret-123")
TEST_REPO = "Saksham-official/RepoMind"


def generate_signature(payload_body: bytes, secret_token: str) -> str:
    """Generate the GitHub signature for the webhook payload."""
    h = hmac.new(secret_token.encode("utf-8"), payload_body, hashlib.sha256)
    return f"sha256={h.hexdigest()}"


def send_webhook(event_type: str, payload: dict):
    """Simulate a GitHub webhook payload delivery to the backend."""
    body = json.dumps(payload).encode("utf-8")
    headers = {
        "X-GitHub-Event": event_type,
        "X-Hub-Signature-256": generate_signature(body, WEBHOOK_SECRET),
        "X-GitHub-Delivery": f"test-delivery-{time.time()}",
        "Content-Type": "application/json",
    }
    print(f"[*] Sending {event_type} webhook to {API_URL}/webhooks/github...")
    response = requests.post(f"{API_URL}/webhooks/github", data=body, headers=headers)
    print(f"[+] Response ({response.status_code}): {response.text}")
    assert response.status_code in [200, 202], f"Webhook failed: {response.text}"


def test_issue_opened():
    """Test the 'issues' event."""
    payload = {
        "action": "opened",
        "issue": {
            "number": 999,
            "title": "ModuleNotFoundError: No module named 'framer-motion'",
            "body": "When running the app, it crashes complaining about missing framer-motion library.",
            "user": {"login": "testuser"},
        },
        "repository": {"full_name": TEST_REPO},
        "installation": {"id": 12345},
    }
    send_webhook("issues", payload)


def test_push_commits():
    """Test the 'push' event (commits)."""
    payload = {
        "ref": "refs/heads/main",
        "commits": [
            {
                "id": "abc123456789",
                "message": "fix: update framer-motion dependencies to resolve module not found error",
                "author": {"name": "Test User", "username": "testuser"},
                "url": f"https://github.com/{TEST_REPO}/commit/abc123456789",
                "added": ["package.json"],
                "removed": [],
                "modified": [],
            }
        ],
        "repository": {"full_name": TEST_REPO},
        "installation": {"id": 12345},
    }
    send_webhook("push", payload)


if __name__ == "__main__":
    print(f"🚀 Starting End-to-End Tests against {API_URL}")
    print("-" * 50)
    
    try:
        # Check if API is up
        health = requests.get(f"{API_URL}/")
        print(f"[+] API Health check passed: {health.json()}")
        
        # Run Tests
        test_issue_opened()
        time.sleep(2)
        test_push_commits()
        
        print("-" * 50)
        print("✅ End-to-end tests completed successfully!")
    except Exception as e:
        print(f"❌ Error running E2E tests: {e}")
        exit(1)
