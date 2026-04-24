import hmac
import hashlib
import os
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks, status

# The api_contracts.md specifies /webhooks/github
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# GITHUB_WEBHOOK_SECRET should be set in your environment variables.
# It MUST match the webhook secret you configure in the GitHub App settings.
GITHUB_WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "default_secret")
print(f"[DEBUG] Webhook Secret loaded: {'Yes' if GITHUB_WEBHOOK_SECRET != 'default_secret' else 'No (using default)'} | Length: {len(GITHUB_WEBHOOK_SECRET)}")

# Simple in-memory cache for idempotency.
# In a production environment, this should ideally be moved to Upstash Redis as per your architecture docs.
PROCESSED_DELIVERIES = set()

async def process_github_event(event_type: str, delivery_id: str, payload: dict):
    # This background task represents the entry point to your AI Pipeline
    print(f"[BACKGROUND] Processing event: {event_type} | Delivery ID: {delivery_id}")
    
    # TODO: Route events based on event_type (e.g., 'issues', 'pull_request', 'push')
    # and pass the payload to the trained ML classifier and logic.
    if event_type == "issues":
        action = payload.get("action")
        print(f"Issue event action: {action}")
        
        # We only triage newly opened issues
        if action == "opened":
            from core.ai.issue_triage import triage_issue
            
            # 1. Run AI logic
            decision = triage_issue(payload)
            print(f"[BACKGROUND] Triage engine returned: {decision}")
            
            # 2. Extract context
            installation_id = payload.get("installation", {}).get("id")
            issue_number = payload["issue"]["number"]
            repo_full_name = payload["repository"]["full_name"]
            repo_id = str(payload.get("repository", {}).get("id"))
            author = payload["issue"]["user"]["login"]

            if installation_id:
                # 3. Log to DB and Broadcast to Frontend Dashboard
                from core.database import log_ai_action, save_repository, update_contributor_journey
                from core.sockets import manager
                import asyncio
                from datetime import datetime

                print(f"[BACKGROUND] Auto-onboarding repo: {repo_full_name}")
                save_repository(repo_id, repo_full_name, installation_id)
                
                # Small delay to allow Supabase to index
                await asyncio.sleep(1.5)
                
                print(f"[BACKGROUND] Logging action to Supabase...")
                log_ai_action(
                    repo_id, 
                    issue_number, 
                    decision.get("action_taken", "triage"), 
                    decision.get("reasoning", ""),
                    confidence_score=decision.get("confidence_score", 1.0),
                    evidence_used=decision.get("evidence_used", {})
                )
                
                # Update contributor journey
                update_contributor_journey(repo_id, author, "first_issue")
                
                ws_type = "issue_triaged"
                if decision.get("predicted_type") == "question":
                   ws_type = "question_answered"

                print(f"[BACKGROUND] Broadcasting {ws_type} to dashboard...")
                await manager.broadcast({
                    "id": str(delivery_id),
                    "type": ws_type,
                    "repo": repo_full_name,
                    "issue_number": issue_number,
                    "classification": decision.get("predicted_type", "triage"),
                    "message": decision.get("comment", "")[:100] + "...",
                    "timestamp": datetime.now().isoformat()
                })
                
                await manager.broadcast({
                    "type": "repo_discovered",
                    "repo": repo_full_name,
                    "timestamp": datetime.now().isoformat()
                })

                # 4. GitHub API writes (Labels, Comments) - Moved to end and made optional
                try:
                    from core.github_client import github_post_comment, github_add_labels
                    if decision.get("comment"):
                        github_post_comment(installation_id, repo_full_name, issue_number, decision["comment"])
                    if decision.get("labels_to_add"):
                        github_add_labels(installation_id, repo_full_name, issue_number, decision["labels_to_add"])
                except Exception as gh_e:
                    print(f"  -> [GITHUB_API] Skipped/Failed: {gh_e} (Expected in local dev without real tokens)")
            else:
                print("[WARNING] WARNING: No 'installation.id' in payload. Cannot authenticate GitHub API requests.")

        elif action == "labeled":
            # Detect Maintainer Correction for Teach Mode
            sender = payload.get("sender", {}).get("login")
            label_added = payload.get("label", {}).get("name")
            issue_number = payload["issue"]["number"]
            repo_id = str(payload["repository"]["id"])
            installation_id = payload.get("installation", {}).get("id")
            repo_full_name = payload["repository"]["full_name"]

            # We assume RepoMind is NOT the sender here
            # In a real app, we'd check if the system recently labeled this issue with something else
            print(f"[TEACH_MODE] Label '{label_added}' added to issue #{issue_number} by {sender}")
            
            # Simulated logic: if system labeled as 'bug' but maintainer added 'enhancement'
            # We would look up ai_actions for this issue_number
            # For demo, we'll just log that we saw a correction if it's a known maintainer
            if sender != "orbiter-bot": # Replace with actual bot name
                from core.database import save_teach_rule
                # This is where the interactive "Should I label similar issues as..." would start
                # For now, we log the rule
                # save_teach_rule(repo_id, "bug", label_added)
                pass

    elif event_type == "issue_comment":
        action = payload.get("action")
        comment = payload.get("comment", {})
        body = comment.get("body", "").lower()
        author = comment.get("user", {}).get("login", "")
        
        print(f"Issue Comment event from {author}")
        
        # --- Advanced Unique Feature: Toxicity & Maintainer Burnout Detection ---
        # A real implementation would pass `body` to an NLP sentiment analysis model.
        # Here we simulate hitting a threshold using a fallback keyword check:
        toxic_keywords = ["stupid", "idiot", "worst", "hate", "worthless"]
        if any(keyword in body for keyword in toxic_keywords):
            print(f"[ALERT] Toxicity threshold exceeded in comment by {author}.")
            # TODO: Add to database `toxicity_alerts` and send private warning to maintainer dashboard
            
        # Example burnout detection:
        # if author in CORE_MAINTAINERS and time_of_comment is outside_working_hours:
            # print(f"[ALERT] Core maintainer {author} is active during rest hours. Flagging burnout risk.")
            
    elif event_type == "push":
        # Ensure we only analyze pushes that actually contain commits (not just tag creation, etc)
        commits = payload.get("commits", [])
        if commits:
            from core.ai.commit_intelligence import analyze_push_event
            
            # 1. Analyze the commits using our ML model
            results = analyze_push_event(payload)
            
            print(f"[BACKGROUND] Push analysis complete. {len(results)} commits categorized.")
        else:
            print("[BACKGROUND] Push event received but no commits attached to analyze.")

@router.post("/github")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_github_event: str = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
    x_github_delivery: str = Header(None, alias="X-GitHub-Delivery")
):
    print(f"[DEBUG] Received webhook: {x_github_event} | Delivery: {x_github_delivery}")
    # 1. Require strict presence of headers
    if not x_github_event or not x_github_delivery:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Missing required GitHub headers."
        )
        
    # 2. Extract Body (required for HMAC verification)
    body = await request.body()
    
    # 3. HMAC-SHA256 Verification
    # GitHub's signature comes as: sha256=abcdef123...
    secret = os.environ.get("GITHUB_WEBHOOK_SECRET", "default_secret")
    
    if not x_hub_signature_256:
        if secret != "default_secret":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Secret is configured but signature header is missing."
            )
        # Otherwise, allow missing signature if no secret is set
        print("[SECURITY] Missing signature header, but no secret is configured. Proceeding...")
        signature = None
    elif not x_hub_signature_256.startswith("sha256="):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid signature format. Must start with 'sha256='."
        )
    else:
        signature = x_hub_signature_256.split("=")[1]
    
    # Generate HMAC using the secret and the raw body
    mac = hmac.new(secret.encode(), msg=body, digestmod=hashlib.sha256)
    expected_signature = mac.hexdigest()
    
    # Use hmac.compare_digest to prevent time-based attacks
    if signature and secret != "default_secret" and not hmac.compare_digest(expected_signature, signature):
        print(f"[SECURITY] Invalid HMAC signature. Expected: {expected_signature}, Got: {signature}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid HMAC signature. Request rejected."
        )
    elif secret == "default_secret":
        print("[SECURITY] WARNING: Skipping HMAC verification (GITHUB_WEBHOOK_SECRET not set).")

    # 4. Enforce Idempotency (Prevent Duplicate Processing)
    if x_github_delivery in PROCESSED_DELIVERIES:
        return {"status": "ok", "message": "Delivery ID already processed. Ignoring duplicate."}
        
    # Mark delivery as processed
    PROCESSED_DELIVERIES.add(x_github_delivery)
    
    # 5. Extract JSON Payload safely
    payload = await request.json()
    
    # 6. Dispatch Payload to Background Process
    # We do NOT await this. It runs independently so we can immediately ACK GitHub.
    background_tasks.add_task(process_github_event, x_github_event, x_github_delivery, payload)

    # 7. ACK with 200 OK immediately
    return {"status": "ok", "message": "Webhook received successfully."}
