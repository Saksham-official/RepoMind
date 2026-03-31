import random

def triage_issue(issue_event_payload: dict) -> dict:
    """
    Main entry point for the Issue Triage Agent (Phase 2).
    It orchestrates duplicate detection, ML classification, and GitHub actions.
    """
    issue = issue_event_payload.get("issue", {})
    issue_number = issue.get("number")
    title = issue.get("title", "")
    body = issue.get("body", "")
    author = issue.get("user", {}).get("login", "")
    repo = issue_event_payload.get("repository", {}).get("full_name")

    print(f"\n[AI_TRIAGE] Starting triage for {repo}#Issue_{issue_number}: '{title}'")
    
    # 1. Duplicate Detection (via ChromaDB)
    # TODO: Embed `body` and search ChromaDB `issues` collection
    is_duplicate = False
    duplicate_of = None
    # Simulating DB search
    if "exact same error" in body.lower():
        is_duplicate = True
        duplicate_of = 101 # Simulated matching ID
    
    if is_duplicate:
        print(f"[AI_TRIAGE] Found duplicate issue: #{duplicate_of}")
        return {
            "action_taken": "mark_duplicate",
            "comment": f"Thanks for reporting! It looks like this is a duplicate of #{duplicate_of}.",
            "labels_to_add": ["duplicate"]
        }

    # 2. ML Classification
    # Since the unified ML model handles both issues and commits, we extract text features:
    # TODO: Add issue features like has_error_traceback, text length to the ML model `classify_issue`
    predicted_type = _mock_classify_issue(title, body)
    
    print(f"[AI_TRIAGE] Classified issue as: {predicted_type}")

    # 3. GitHub Actions to take
    # We return the actions we *want* to take, and allow the background task runner to execute them.
    labels_to_add = ["triage"]
    comment = f"Hello @{author}! Thanks for opening an issue. Our AI Maintainer has classified this as a `{predicted_type}` and labeled it accordingly."
    
    if predicted_type == "bug":
        labels_to_add.append("bug")
    elif predicted_type == "feature":
        labels_to_add.append("enhancement")
    elif predicted_type == "question":
        labels_to_add.append("question")
        
        # --- Invoke the Contributor Helper (RAG) ---
        from core.ai.contributor_helper import synthesize_answer
        rag_answer = synthesize_answer(repo, title + "\n" + body)
        comment = f"Hello @{author}! I am Orbiter, the AI Maintainer. I see you have a question. Let me check the docs:\n\n{rag_answer}"

    return {
        "action_taken": "triage_and_label",
        "comment": comment,
        "labels_to_add": labels_to_add
    }

def _mock_classify_issue(title: str, body: str) -> str:
    """ Temporary stub for the Unified ML Classifier on the Issue text payload. """
    text = (title + " " + body).lower()
    if "bug" in text or "error" in text or "fail" in text:
        return "bug"
    elif "feature" in text or "add" in text:
        return "feature"
    elif "how" in text or "why" in text or "?" in text:
        return "question"
    
    return random.choice(["bug", "feature", "question"])
