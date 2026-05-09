from core.github_client import github_update_release
from core.database import get_db_client

async def handle_release(payload: dict):
    """
    Handles 'release.published' event.
    Generates a changelog from recently analyzed commits and updates the release body.
    """
    release = payload.get("release", {})
    release_id = release.get("id")
    repo_full_name = payload.get("repository", {}).get("full_name")
    repo_id = str(payload.get("repository", {}).get("id"))
    installation_id = payload.get("installation", {}).get("id")
    tag_name = release.get("tag_name")

    if not all([release_id, repo_full_name, installation_id]):
        print("[RELEASE] Missing metadata. Skipping.")
        return

    print(f"[RELEASE] Generating changelog for {repo_full_name} tag {tag_name}")

    # 1. Fetch analyzed commits for this repository from Supabase
    # In a real scenario, we'd fetch commits between this tag and the previous one.
    # For now, we fetch the 20 most recent commits.
    client = get_db_client()
    commits = []
    if client:
        try:
            # We first need the internal UUID for the repo
            repo_resp = client.table("repositories").select("id").eq("github_repo_id", int(repo_id)).execute()
            if repo_resp.data:
                internal_id = repo_resp.data[0]["id"]
                commit_resp = client.table("commits").select("*").eq("repo_id", internal_id).order("created_at", descending=True).limit(20).execute()
                commits = commit_resp.data
        except Exception as e:
            print(f"[RELEASE] Error fetching commits: {e}")

    # 2. Group commits by category
    categories = {
        "feat": [],
        "fix": [],
        "refactor": [],
        "docs": [],
        "other": []
    }
    
    for c in commits:
        cat = c.get("classification", "other")
        msg = c.get("message", "No message")
        sha = c.get("sha", "")[:7]
        line = f"- {msg} ({sha})"
        
        if cat in categories:
            categories[cat].append(line)
        else:
            categories["other"].append(line)

    # 3. Build Markdown Changelog
    changelog = f"## 🚀 Release {tag_name}\n\n"
    changelog += "Generated automatically by **Orbiter AI**.\n\n"
    
    if categories["feat"]:
        changelog += "### ✨ New Features\n" + "\n".join(categories["feat"]) + "\n\n"
    if categories["fix"]:
        changelog += "### 🐛 Bug Fixes\n" + "\n".join(categories["fix"]) + "\n\n"
    if categories["refactor"]:
        changelog += "### 🛠️ Refactoring\n" + "\n".join(categories["refactor"]) + "\n\n"
    if categories["docs"]:
        changelog += "### 📝 Documentation\n" + "\n".join(categories["docs"]) + "\n\n"
        
    if not any(categories.values()):
        changelog += "_No recent commits found to categorize._\n"

    # 4. Update the Release in GitHub
    github_update_release(installation_id, repo_full_name, release_id, changelog)
    
    # 5. Broadcast to Dashboard
    try:
        from core.sockets import manager
        from datetime import datetime
        await manager.broadcast({
            "type": "changelog_generated",
            "repo": repo_full_name,
            "tag": tag_name,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"[RELEASE] Dashboard broadcast failed: {e}")
