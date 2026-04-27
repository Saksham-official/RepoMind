import re
from core.github_client import github_get_pr_diff, github_post_pr_review

async def review_pr(payload: dict):
    """
    Main entry point for the PR Review Agent.
    Fetches the diff, analyzes it for common patterns, and posts a review.
    """
    action = payload.get("action")
    pr = payload.get("pull_request", {})
    pr_number = pr.get("number")
    repo_full_name = payload.get("repository", {}).get("full_name")
    installation_id = payload.get("installation", {}).get("id")
    
    if not all([pr_number, repo_full_name, installation_id]):
        print("[PR_REVIEW] Missing metadata for PR review. Skipping.")
        return

    print(f"[PR_REVIEW] Starting review for {repo_full_name}#{pr_number} (Action: {action})")

    # 1. Fetch the diff
    diff = github_get_pr_diff(installation_id, repo_full_name, pr_number)
    if not diff:
        print("[PR_REVIEW] Could not fetch diff. Review aborted.")
        return

    # 2. Analyze the diff
    review_comments = analyze_diff_for_patterns(diff)
    
    # 3. Formulate the overall summary
    summary = "Hello! I'm **Orbiter**, your AI review assistant. I've scanned your changes for common patterns."
    
    if not review_comments:
        summary += "\n\n✅ No obvious issues detected. Great job!"
        event = "APPROVE"
    else:
        summary += f"\n\n⚠️ I found {len(review_comments)} items that might need your attention."
        event = "COMMENT" # Use COMMENT for bot reviews unless confident

    # 4. Post the review
    github_post_pr_review(
        installation_id, 
        repo_full_name, 
        pr_number, 
        summary, 
        event=event, 
        comments=review_comments
    )
    
    # 5. Broadcast to dashboard
    try:
        from core.sockets import manager
        from datetime import datetime
        await manager.broadcast({
            "type": "pr_reviewed",
            "repo": repo_full_name,
            "pr_number": pr_number,
            "summary": summary[:100] + "...",
            "issue_count": len(review_comments),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"[PR_REVIEW] Dashboard broadcast failed: {e}")

def analyze_diff_for_patterns(diff: str) -> list:
    """
    Scans a unified diff for common code quality issues.
    Returns a list of dicts: {'path': str, 'line': int, 'body': str}
    """
    comments = []
    current_file = None
    line_number = 0
    
    # Unified diff parsing (very basic)
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            current_file = line[6:]
            line_number = 0
            continue
        
        if line.startswith("@@"):
            # Extract starting line number from hunk header: @@ -1,4 +1,5 @@
            match = re.search(r"\+(\d+)", line)
            if match:
                line_number = int(match.group(1)) - 1
            continue

        if line.startswith("+") and not line.startswith("+++"):
            line_number += 1
            content = line[1:].strip()
            
            # --- Pattern Matching ---
            
            # 1. TODO/FIXME
            if any(token in content.upper() for token in ["TODO:", "FIXME:"]):
                comments.append({
                    "path": current_file,
                    "line": line_number,
                    "body": "💡 Found a `TODO` or `FIXME`. Ensure this is tracked in an issue before merging."
                })
            
            # 2. Print statements (often leftover debugging)
            if content.startswith("print(") and current_file.endswith(".py"):
                comments.append({
                    "path": current_file,
                    "line": line_number,
                    "body": "🛑 `print()` statement detected. Consider using a proper logger for production code."
                })
            
            # 3. Hardcoded Secrets (Very simple regex)
            if re.search(r"(api_key|password|secret|token)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]", content.lower()):
                comments.append({
                    "path": current_file,
                    "line": line_number,
                    "body": "🚨 **Potential Secret Leak**: Detected a hardcoded string assigned to a variable that looks like a secret. Use environment variables instead."
                })

            # 4. Large deletions (not in current hunk, but we could track additions/deletions)
            # This is handled per-line above, but we could do more complex logic here.

        elif not line.startswith("-"):
            # Unchanged line in hunk
            line_number += 1

    return comments[:10] # Cap at 10 comments to avoid spamming
