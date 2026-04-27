import os
import time
import jwt
import requests
from github import Github, Auth
import redis

# Configuration payload for GitHub App Private Key and App ID
GITHUB_APP_ID = os.environ.get("GITHUB_APP_ID", "123456")
GITHUB_PRIVATE_KEY = os.environ.get("GITHUB_PRIVATE_KEY", "")

# Upstash Redis connection setup
redis_client = None
if os.environ.get("UPSTASH_REDIS_URL"):
    redis_client = redis.Redis(
        host=os.environ.get("UPSTASH_REDIS_URL"),
        port=int(os.environ.get("UPSTASH_REDIS_PORT", 6379)),
        password=os.environ.get("UPSTASH_REDIS_PASSWORD"),
        ssl=True
    )

# In-memory fallback if Redis is not configured
_memory_cache = {}

def get_installation_token(installation_id: int) -> str:
    """
    Retrieves a short-lived GitHub App Installation Token for a specific repository.
    Tokens are cached in Upstash Redis (or in-memory fallback) to prevent rate limits.
    """
    cache_key = f"github_token:{installation_id}"
    
    # 1. Check Cache for an existing non-expired token.
    if redis_client:
        try:
            cached_token = redis_client.get(cache_key)
            if cached_token:
                return cached_token.decode("utf-8")
        except Exception as e:
            print(f"Redis cache error: {e}")
    else:
        # Fallback to local memory cache
        cached = _memory_cache.get(cache_key)
        if cached and cached["exp"] > time.time():
            return cached["token"]

    # 2. If no valid cache exists, generate a new JWT and request an Installation Token
    if not GITHUB_PRIVATE_KEY:
        print("[WARNING] WARNING: GITHUB_PRIVATE_KEY is not set. Using mock token for testing.")
        return "mock_installation_token"

    payload = {
        'iat': int(time.time()) - 60, # issued at 60 seconds ago to account for clock drift
        'exp': int(time.time()) + (5 * 60), # expire in 5 minutes (GitHub max is 10)
        'iss': GITHUB_APP_ID
    }
    
    encoded_jwt = jwt.encode(payload, GITHUB_PRIVATE_KEY, algorithm='RS256')
    
    headers = {
        "Authorization": f"Bearer {encoded_jwt}",
        "Accept": "application/vnd.github.v3+json"
    }

    # Exchange JWT for Installation Access Token
    response = requests.post(f"https://api.github.com/app/installations/{installation_id}/access_tokens", headers=headers)
    
    if response.status_code != 201:
        print(f"Failed to authenticate as GitHub App: {response.text}")
        return "mock_installation_token"
        
    token_data = response.json()
    token = token_data["token"]
    
    # 3. Store in Cache with a TTL of ~55 minutes (tokens expire in 1 hour by GitHub)
    if redis_client:
        try:
            redis_client.setex(cache_key, 3300, token)
        except Exception as e:
            print(f"Redis cache set error: {e}")
    else:
        _memory_cache[cache_key] = {
            "token": token,
            "exp": time.time() + 3300
        }
    
    return token

def get_github_client(installation_id: int) -> Github:
    """Returns an authenticated PyGithub instance mapped to an installation instance."""
    token = get_installation_token(installation_id)
    # We use PyGithub's Token Authentication
    auth = Auth.Token(token)
    return Github(auth=auth)

def github_post_comment(installation_id: int, repo_full_name: str, issue_number: int, comment: str):
    """Posts a comment on an issue or PR using the Orbiter Bot identity."""
    print(f"[GITHUB_API] Posting comment on {repo_full_name}#{issue_number}...")
    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)
        issue = repo.get_issue(number=issue_number)
        
        # Actual API write
        issue.create_comment(comment)
        print(f"[GITHUB_API] SUCCESS: Comment posted: '{comment}'")
        
    except Exception as e:
        print(f"[GITHUB_API] ERROR posting comment: {e}")

def github_add_labels(installation_id: int, repo_full_name: str, issue_number: int, labels: list):
    """Applies labels to an issue or PR using the Orbiter Bot identity."""
    if not labels:
        return
        
    print(f"[GITHUB_API] Adding labels {labels} to {repo_full_name}#{issue_number}...")
    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)
        issue = repo.get_issue(number=issue_number)
        
        # Actual API write
        issue.add_to_labels(*labels)
        print(f"[GITHUB_API] SUCCESS: Labels added: {labels}")
        
    except Exception as e:
        print(f"[GITHUB_API] ERROR adding labels: {e}")

def github_fetch_repo_docs(installation_id: int, repo_full_name: str) -> list[dict]:
    """
    Fetches all Markdown (.md, README) files from a GitHub repo using the App token.
    Returns a list of {filename, content} dicts — no local disk required.
    Caps at 100 files to avoid abuse.
    """
    print(f"[GITHUB_API] Fetching docs for {repo_full_name}...")
    results = []
    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)

        # Walk the entire git tree (recursive=True gives us every file in one API call)
        tree = repo.get_git_tree(sha=repo.default_branch, recursive=True)

        md_blobs = [
            item for item in tree.tree
            if item.type == "blob" and (
                item.path.endswith(".md")
                or item.path.lower() == "readme"
                or item.path.lower().startswith("readme.")
            )
        ][:100]  # cap at 100 files

        print(f"[GITHUB_API] Found {len(md_blobs)} doc files in {repo_full_name}")

        for blob in md_blobs:
            try:
                content_file = repo.get_contents(blob.path)
                # get_contents can return a list for dirs; guard against it
                if isinstance(content_file, list):
                    continue
                decoded = content_file.decoded_content.decode("utf-8", errors="ignore")
                results.append({"filename": blob.path, "content": decoded})
            except Exception as fe:
                print(f"[GITHUB_API] Skipping {blob.path}: {fe}")

        print(f"[GITHUB_API] Successfully fetched {len(results)} doc files")
    except Exception as e:
        print(f"[GITHUB_API] ERROR fetching repo docs: {e}")

    return results

def github_get_pr_diff(installation_id: int, repo_full_name: str, pr_number: int) -> str:
    """Fetches the raw diff of a Pull Request."""
    print(f"[GITHUB_API] Fetching diff for {repo_full_name}#{pr_number}...")
    try:
        token = get_installation_token(installation_id)
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3.diff"
        }
        response = requests.get(f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}", headers=headers)
        if response.status_code == 200:
            return response.text
        else:
            print(f"[GITHUB_API] Failed to fetch diff: {response.status_code} {response.text}")
            return ""
    except Exception as e:
        print(f"[GITHUB_API] ERROR fetching diff: {e}")
        return ""

def github_post_pr_review(installation_id: int, repo_full_name: str, pr_number: int, body: str, event: str = "COMMENT", comments: list = None):
    """
    Posts a review on a PR.
    'event' can be 'APPROVE', 'REQUEST_CHANGES', or 'COMMENT'.
    'comments' is a list of dicts: {'path': '...', 'line': 123, 'body': '...'}
    """
    print(f"[GITHUB_API] Posting PR review on {repo_full_name}#{pr_number}...")
    try:
        token = get_installation_token(installation_id)
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        data = {
            "body": body,
            "event": event
        }
        if comments:
            data["comments"] = comments
            
        response = requests.post(
            f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}/reviews",
            headers=headers,
            json=data
        )
        if response.status_code == 201:
            print(f"[GITHUB_API] SUCCESS: PR review posted.")
        else:
            print(f"[GITHUB_API] Failed to post PR review: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[GITHUB_API] ERROR posting PR review: {e}")

def github_assign_issue(installation_id: int, repo_full_name: str, issue_number: int, assignees: list):
    """Assigns users to an issue or PR."""
    print(f"[GITHUB_API] Assigning {assignees} to {repo_full_name}#{issue_number}...")
    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)
        issue = repo.get_issue(number=issue_number)
        issue.add_to_assignees(*assignees)
        print(f"[GITHUB_API] SUCCESS: Assigned {assignees}")
    except Exception as e:
        print(f"[GITHUB_API] ERROR assigning: {e}")

def github_update_release(installation_id: int, repo_full_name: str, release_id: int, body: str):
    """Updates the body of a GitHub release."""
    print(f"[GITHUB_API] Updating release {release_id} in {repo_full_name}...")
    try:
        gh = get_github_client(installation_id)
        repo = gh.get_repo(repo_full_name)
        release = repo.get_release(id=release_id)
        release.edit(body=body)
        print(f"[GITHUB_API] SUCCESS: Release body updated.")
    except Exception as e:
        print(f"[GITHUB_API] ERROR updating release: {e}")
