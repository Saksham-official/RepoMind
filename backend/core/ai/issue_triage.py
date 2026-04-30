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
    body = issue.get("body", "") or ""
    author = issue.get("user", {}).get("login", "")
    repo = issue_event_payload.get("repository", {}).get("full_name")
    installation_id = issue_event_payload.get("installation", {}).get("id")

    print(f"\n[AI_TRIAGE] Starting triage for {repo}#{issue_number}: '{title}'")

    # ── 0. Minimum Content Guard ─────────────────────────────────────────────
    # Reject trivially short issues (greetings, accidental submits, test pings)
    combined_text = (title + " " + body).strip()
    if len(combined_text) < 20:
        print(f"[AI_TRIAGE] Issue too short ({len(combined_text)} chars) — skipping triage.")
        return {
            "action_taken": "skipped",
            "comment": None,
            "labels_to_add": [],
        }

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
    classification_results = _mock_classify_issue_v2(title, body)
    predicted_type = classification_results["type"]
    confidence = classification_results["confidence"]
    reasoning = classification_results["reasoning"]
    evidence = classification_results["evidence"]
    
    # ── 2b. Apply Teach Rules (Corrections) ───────────────────────────────────
    # In a real system, we'd fetch rules for this repo from the DB
    # For now, we simulate a rule where 'feature' was corrected to 'enhancement' or similar
    # if repo_id in rules: ...
    
    print(f"[AI_TRIAGE] Classified issue as: {predicted_type} (Confidence: {confidence})")

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
        # Step A: Auto-ingest repo docs and issues
        if installation_id:
            try:
                from core.ai.ingest_docs import auto_ingest_from_github, ingest_issues, ingest_commits, ingest_actions
                from core.database import get_db_client

                # Index Documentation
                auto_ingest_from_github(installation_id, repo)

                # Resolve repo_id from DB by full_name (owner/repo_name)
                client = get_db_client()
                rid = None
                if client:
                    repo_resp = client.table("repositories").select("id") \
                        .eq("owner", repo.split('/')[0]) \
                        .eq("repo_name", repo.split('/')[1]).execute()
                    if repo_resp.data:
                        rid = repo_resp.data[0]['id']

                if client and rid:
                    # 1. Fetch & Index Issues
                    issues_resp = client.table("issues").select("*").eq("repo_id", rid).execute()
                    if issues_resp.data:
                        ingest_issues(repo, issues_resp.data)

                    # 2. Fetch & Index Commits
                    commits_resp = client.table("commits").select("*").eq("repo_id", rid).execute()
                    if commits_resp.data:
                        ingest_commits(repo, commits_resp.data)

                    # 3. Fetch & Index AI Actions
                    actions_resp = client.table("ai_actions").select("*").eq("repo_id", rid).execute()
                    if actions_resp.data:
                        ingest_actions(repo, actions_resp.data)

                    print(f"[AI_TRIAGE] Brain Sync complete for '{repo}' (repo_id={rid}): Docs, Issues, Commits, Actions indexed.")
                elif client:
                    print(f"[AI_TRIAGE] Could not resolve repo_id for '{repo}' — skipping DB ingestion.")

            except Exception as e:
                print(f"[AI_TRIAGE] Auto-ingest failed (non-fatal): {e}")
        else:
            print("[AI_TRIAGE] No installation_id — skipping auto-ingest.")

        # Step B: Search the indexed docs + synthesize answer with Gemini
        try:
            from core.ai.contributor_helper import synthesize_answer, detect_search_type
            question = f"{title}\n\n{body}".strip()

            # Detect what the question is actually about so preamble is accurate
            search_type = detect_search_type(question)
            search_type_labels = {
                "doc": "repository documentation",
                "issue": "existing issues",
                "commit": "commit history",
                "action": "AI action logs",
            }
            searched_label = search_type_labels.get(search_type, "repository knowledge base")

            rag_answer = synthesize_answer(repo, question)
            comment = (
                f"Hello @{author}! 👋 I'm **RepoMind**, your AI maintainer.\n\n"
                f"I detected this as a **question** and automatically searched the {searched_label}. "
                f"Here's what I found:\n\n"
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
        "confidence_score": confidence,
        "reasoning": reasoning,
        "evidence_used": evidence
    }


def _mock_classify_issue_v2(title: str, body: str) -> dict:
    """Enhanced mock classifier with explainability metadata."""
    text = (title + " " + body).lower()
    body_word_count = len((body or "").split())

    # Bug: prioritize error signals first
    if "bug" in text or "error" in text or "fail" in text or "crash" in text or "exception" in text or "traceback" in text:
        return {
            "type": "bug",
            "confidence": 0.92,
            "reasoning": "Detected error-related keywords ('bug', 'error', 'fail', 'crash') in the title or body.",
            "evidence": {"keywords": ["bug", "error", "fail"], "has_traceback": "traceback" in text or "exception" in text}
        }

    # Feature request: only if there's enough content to be meaningful
    elif ("feature" in text or "implement" in text or ("add" in text and "support" in text)) and body_word_count >= 5:
        return {
            "type": "feature",
            "confidence": 0.85,
            "reasoning": "Identified request for new functionality or support for a feature.",
            "evidence": {"keywords": ["feature", "add", "support"], "is_request": True}
        }

    # Question: require a meaningful body (>= 8 words) AND a clear interrogative signal
    # This prevents greetings like "Hello!" or "Hi, how are you?" from triggering full RAG
    elif body_word_count >= 8 and ("how" in text or "why" in text or "what" in text or "?" in text or "how do" in text or "how to" in text):
        return {
            "type": "question",
            "confidence": 0.90,
            "reasoning": "Interrogative sentence structure detected with sufficient context.",
            "evidence": {"keywords": ["how", "why", "?"], "contains_question_mark": "?" in text, "word_count": body_word_count}
        }

    return {
        "type": "other",
        "confidence": 0.5,
        "reasoning": "No strong indicators for bug, feature, or question.",
        "evidence": {}
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
