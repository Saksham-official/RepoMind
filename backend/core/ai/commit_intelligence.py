from core.ml.classifier import classify_commit

def analyze_push_event(push_payload: dict):
    """
    Main entry point for Commit Intelligence (Phase 2).
    Processes GitHub `push` webhook events, extracts commits, and runs them
    through the trained unified ML model (RandomForest + TF-IDF).
    """
    repo_full_name = push_payload.get("repository", {}).get("full_name")
    commits = push_payload.get("commits", [])
    pusher = push_payload.get("pusher", {}).get("name", "Unknown")
    
    # We will need the github client if we want accurate additions/deletions
    installation_id = push_payload.get("installation", {}).get("id")
    
    print(f"\n[COMMIT_INTELLIGENCE] Processing push by {pusher} to {repo_full_name} ({len(commits)} commits)")
    
    analyzed_commits = []
    
    # Analyze each commit pushed
    for commit_data in commits:
        commit_sha = commit_data.get("id")
        message = commit_data.get("message", "")
        
        # In a push webhook, GitHub gives us arrays of files added/removed/modified
        files_added = len(commit_data.get("added", []))
        files_removed = len(commit_data.get("removed", []))
        files_modified = len(commit_data.get("modified", []))
        total_files_changed = files_added + files_removed + files_modified
        
        # GitHub push payloads DO NOT contain precise line additions/deletions.
        # So we have to fetch the commit exactly via the PyGithub client using the installation token.
        additions = 0
        deletions = 0
        
        if installation_id:
            try:
                from core.github_client import get_github_client
                gh = get_github_client(installation_id)
                repo = gh.get_repo(repo_full_name)
                gh_commit = repo.get_commit(sha=commit_sha)
                
                # Extract exact stats
                additions = gh_commit.stats.additions
                deletions = gh_commit.stats.deletions
            except Exception as e:
                print(f"[COMMIT_INTELLIGENCE] Could not fetch exact commit stats from GitHub API: {e}")
        
        # 1. Run through ML Classifier
        classification = classify_commit(message, additions, deletions, total_files_changed)
        
        # 2. Compile result
        result = {
            "sha": commit_sha[:7],
            "message": message.split("\n")[0],
            "stats": f"+{additions} -{deletions} ({total_files_changed} files)",
            "ml_prediction": classification["type"],
            "confidence": classification["confidence"],
            "is_breaking": classification["is_breaking"]
        }
        
        print(f"  → [{result['sha']}] {result['ml_prediction'].upper()} ({result['confidence']*100}%): {result['message']}")
        # 2. Graph Intelligence: Extract Links
        from core.ai.graph_agent import link_entities
        repo_id = str(push_payload.get("repository", {}).get("id"))
        link_entities(repo_id, commit_sha, "commit", message)

        # 3. Compile result
        # The AI intelligence immediately beams down to any open Next.js dashboard!
        import asyncio
        from core.sockets import manager
        
        try:
            loop = asyncio.get_running_loop()
            import datetime
            # We schedule the broadcast to run so it doesn't block local Python execution
            loop.create_task(manager.broadcast({
                "type": "commit_analyzed",
                "repo": repo_full_name,
                "sha": result["sha"],
                "message": result["message"],
                "classification": result["ml_prediction"],
                "confidence": result["confidence"],
                "timestamp": datetime.datetime.now().isoformat()
            }))
            print(f"  → 📡 Broadcasted {result['sha']} to Dashboard Sockets")
        except RuntimeError:
            pass

    return analyzed_commits
