from core.github_client import github_post_comment, github_add_labels, github_assign_issue

def is_question(text: str) -> bool:
    """Detects if a string likely contains a question."""
    text = text.lower().strip()
    if "?" in text:
        return True
    
    starters = ["how ", "why ", "what ", "where ", "can you ", "is there ", "do i ", "any help "]
    return any(text.startswith(s) for s in starters)

async def handle_comment(payload: dict):
    """
    Handles issue and PR comments.
    Triggers on @orbiter mentions OR proactive question detection.
    """
    comment = payload.get("comment", {})
    body = comment.get("body", "")
    author = comment.get("user", {}).get("login", "")
    author_type = comment.get("user", {}).get("type")
    
    # Ignore bots to prevent loops
    if author_type == "Bot" or author == "orbiter-bot" or author.endswith("[bot]"):
        return

    issue = payload.get("issue", {})
    pr = payload.get("pull_request", {})
    target = issue or pr
    target_number = target.get("number")
    repo_full_name = payload.get("repository", {}).get("full_name")
    installation_id = payload.get("installation", {}).get("id")
    
    if not all([target_number, repo_full_name, installation_id]):
        return

    is_mentioned = "@orbiter" in body.lower()
    has_question = is_question(body)

    if not (is_mentioned or has_question):
        # Not for us
        return

    print(f"[ENGAGE] Handling comment from @{author} on {repo_full_name}#{target_number} (Mention: {is_mentioned}, Question: {has_question})")

    # 1. Command Parsing (Mentions only)
    if is_mentioned:
        lines = body.splitlines()
        commands_found = []
        
        for line in lines:
            line = line.strip()
            if line.startswith("/label "):
                labels = line[7:].split(",")
                labels = [l.strip() for l in labels]
                commands_found.append(("label", labels))
            elif line.startswith("/assign "):
                assignees = line[8:].split(",")
                assignees = [a.strip().replace("@", "") for a in assignees]
                commands_found.append(("assign", assignees))
            elif line.startswith("/close"):
                commands_found.append(("close", None))

        if commands_found:
            for cmd_type, args in commands_found:
                if cmd_type == "label":
                    github_add_labels(installation_id, repo_full_name, target_number, args)
                elif cmd_type == "assign":
                    github_assign_issue(installation_id, repo_full_name, target_number, args)
                elif cmd_type == "close":
                    github_post_comment(installation_id, repo_full_name, target_number, "Closing this as requested.")
            
            github_post_comment(installation_id, repo_full_name, target_number, f"Executed requested commands for @{author}.")
            return

    # 2. RAG Response
    from core.ai.contributor_helper import synthesize_answer
    
    try:
        # Clean the body
        clean_body = body.replace("@orbiter", "").strip()
        if not clean_body:
            if is_mentioned:
                github_post_comment(installation_id, repo_full_name, target_number, f"Yes @{author}, how can I help you today?")
            return
            
        answer = synthesize_answer(repo_full_name, clean_body)
        
        greeting = f"Hello @{author}!"
        if has_question and not is_mentioned:
            greeting = f"Hi @{author}! I noticed you had a question. I've searched the repository context to help out:"
        elif is_mentioned:
            greeting = f"Hello @{author}! I've searched the repository context for your request:"

        response = f"{greeting}\n\n---\n\n{answer}\n\n---\n\n_I am an AI assistant here to help with maintenance. Mention me if you need specific commands!_"
        github_post_comment(installation_id, repo_full_name, target_number, response)
    except Exception as e:
        print(f"[ENGAGE] RAG fallback failed: {e}")
