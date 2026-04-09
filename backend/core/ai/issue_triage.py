import random


def triage_issue(issue_event_payload: dict) -> dict:
    """
    Main entry point for the Issue Triage Agent.
    Orchestrates: duplicate detection → ML classification → RAG (if question) → GitHub actions.

    For 'question' type issues the pipeline is FULLY AUTOMATIC:
      1. Fetches the repo's docs from GitHub API      (auto_ingest_from_github)
      2. Indexes them into Supabase pgvector           (if not already done)
      3. Searches for the most relevant doc chunks     (match_repo_embeddings RPC)
      4. Sends context + question to Gemini            (synthesize_answer)
      5. Returns the answer to be posted as a comment  (via github_post_comment)
    """
    issue = issue_event_payload.get("issue", {})
    issue_number = issue.get("number")
    title = issue.get("title", "")
    body = issue.get("body", "")
    author = issue.get("user", {}).get("login", "")
    repo = issue_event_payload.get("repository", {}).get("full_name")
    installation_id = issue_event_payload.get("installation", {}).get("id")

    print(f"\n[AI_TRIAGE] Starting triage for {repo}#{issue_number}: '{title}'")

    # ── 1. Duplicate Detection (via Supabase pgvector) ───────────────────────
    # TODO: Embed `body` and search repo_embeddings via match_repo_embeddings RPC
    is_duplicate = False
    duplicate_of = None
    if "exact same error" in body.lower():
        is_duplicate = True
        duplicate_of = 101  # Simulated matching ID

    if is_duplicate:
        print(f"[AI_TRIAGE] Found duplicate issue: #{duplicate_of}")
        return {
            "action_taken": "mark_duplicate",
            "comment": f"Thanks for reporting! It looks like this is a duplicate of #{duplicate_of}.",
            "labels_to_add": ["duplicate"],
        }

    # ── 2. ML Classification ─────────────────────────────────────────────────
    predicted_type = _mock_classify_issue(title, body)
    print(f"[AI_TRIAGE] Classified issue as: {predicted_type}")

    # ── 3. Build response based on classification ─────────────────────────────
    labels_to_add = ["triage"]
    comment = (
        f"Hello @{author}! Thanks for opening an issue. "
        f"RepoMind has classified this as a `{predicted_type}` and labeled it accordingly."
    )

    if predicted_type == "bug":
        labels_to_add.append("bug")

    elif predicted_type == "feature":
        labels_to_add.append("enhancement")

    elif predicted_type == "question":
        labels_to_add.append("question")

        # ── AUTOMATIC RAG PIPELINE ────────────────────────────────────────────
        # Step A: Auto-ingest repo docs from GitHub (skips if already indexed)
        if installation_id:
            try:
                from core.ai.ingest_docs import auto_ingest_from_github
                ingested = auto_ingest_from_github(installation_id, repo)
                if ingested:
                    print(f"[AI_TRIAGE] Repo '{repo}' docs are ready in Supabase pgvector.")
                else:
                    print(f"[AI_TRIAGE] Warning: Could not index docs for '{repo}'. RAG may have less context.")
            except Exception as e:
                print(f"[AI_TRIAGE] Auto-ingest failed (non-fatal): {e}")
        else:
            print("[AI_TRIAGE] No installation_id — skipping auto-ingest (cannot auth with GitHub API).")

        # Step B: Search the indexed docs + synthesize answer with Gemini
        try:
            from core.ai.contributor_helper import synthesize_answer
            question = f"{title}\n\n{body}".strip()
            rag_answer = synthesize_answer(repo, question)
            comment = (
                f"Hello @{author}! 👋 I'm **RepoMind**, your AI maintainer.\n\n"
                f"I detected this as a **question** and automatically searched the repository "
                f"documentation to help you. Here's what I found:\n\n"
                f"---\n\n"
                f"{rag_answer}\n\n"
                f"---\n\n"
                f"_If this didn't fully answer your question, a human maintainer will follow up._"
            )
        except Exception as e:
            print(f"[AI_TRIAGE] RAG synthesis failed: {e}")
            comment = (
                f"Hello @{author}! I detected this as a question but encountered an error "
                f"while searching the docs. A human maintainer will follow up soon."
            )
        # ── END RAG PIPELINE ──────────────────────────────────────────────────

    return {
        "action_taken": "triage_and_label",
        "predicted_type": predicted_type,
        "comment": comment,
        "labels_to_add": labels_to_add,
    }


def _mock_classify_issue(title: str, body: str) -> str:
    """Temporary keyword classifier — replace with the real ML model when ready."""
    text = (title + " " + body).lower()
    if "bug" in text or "error" in text or "fail" in text or "crash" in text:
        return "bug"
    elif "feature" in text or "add" in text or "support" in text or "implement" in text:
        return "feature"
    elif "how" in text or "why" in text or "what" in text or "?" in text or "help" in text:
        return "question"

    return random.choice(["bug", "feature", "question"])
