from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Core Scheduled Tasks for the Maintainer Bot

async def clear_old_tokens_from_cache():
    """ 
    Runs every hour. 
    Cleans up potentially dead or expired JWT local structures acting as a fallback for Upstash Redis. 
    """
    print("[SCHEDULER] Running scheduled token cache cleanup...")

async def nightly_digest_email():
    """ 
    Runs every midnight.
    Collects today's AI Triage output and prepares an email for the open-source maintainers,
    alerting them of what Orbiter did autonomously that day.
    """
    print("[SCHEDULER] Scanning logs... Preparing nightly email digest of AI Actions...")
    
async def stale_issue_sweep():
    """ 
    Runs weekly (Sunday at midnight).
    Polls the database for issues that haven't been touched in 60 days.
    Part of the Phase 2 roadmap constraint to auto-close stale issues.
    """
    print("[SCHEDULER] Auto-Scanning for stale GitHub issues...")

scheduler = AsyncIOScheduler()

def start_scheduler():
    """ Boots the scheduler and attaches the Cron-equivalent jobs. """
    scheduler.add_job(clear_old_tokens_from_cache, "interval", hours=1)
    
    # Cron format: Midnight every day
    scheduler.add_job(nightly_digest_email, "cron", hour=0, minute=0)
    
    # Cron format: Midnight every Sunday
    scheduler.add_job(stale_issue_sweep, "cron", day_of_week="sun", hour=0, minute=0)
    
    print("[OK] Background Job Scheduler booted successfully.")
    scheduler.start()

def stop_scheduler():
    """ Gracefully spins down background polling. """
    scheduler.shutdown()
    print("[OK] Background Job Scheduler gracefully shutdown.")
