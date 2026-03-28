# Scoring Engine Spec

Orbiter calculates a dynamically adjusting "Repo Health Score" (from 0 to 100) per repository. The formula combines commit quality, issue responsiveness, and codebase stability to distinguish healthy refactoring/maintenance from high-risk regressions.

## 1. Algorithmic Breakdown
The score applies a sliding window of recent tracking (default 30 days).

1. **Commit Quality (35%)**
   - Assesses the ratio of breaking changes within the recent commits.
   - `breaking_ratio = breaking_commits / max(total_commits, 1)`
   - `commit_quality = 1.0 - min(breaking_ratio * 2, 0.5)`

2. **Activity Level (25%)**
   - Assesses the general vibrance of project momentum.
   - `activity_score = min(total_commits / 20.0, 1.0)`

3. **Issue Response Rate (25%)**
   - Checks what ratio of recent issues have been triaged or handled by Orbiter or human maintainers.
   - `response_rate = triaged_issues / max(total_issues, 1)`

4. **Bug Ratio / Stability (15%)**
   - Evaluates the prevalence of `bug_fix` classified commits (lower bugs = higher stability score).
   - `bug_ratio = bug_commits / max(total_commits, 1)`
   - `bug_score = 1.0 - min(bug_ratio * 1.5, 0.4)`

## 2. Execution Example (from `system_design.md`)
```python
def calculate_health_score(repo_id: str, days: int = 30) -> int:
    """
    Score 0-100 based on recent activity patterns.
    Combines commit quality + issue responsiveness + code stability.
    """
    commits = get_recent_commits(repo_id, days)
    issues = get_recent_issues(repo_id, days)

    # Component 1: Commit quality (0-1)
    breaking = sum(1 for c in commits if c["is_breaking"])
    breaking_ratio = breaking / max(len(commits), 1)
    commit_quality = 1.0 - min(breaking_ratio * 2, 0.5)

    # Component 2: Activity level (0-1)
    activity = min(len(commits) / 20, 1.0)  # 20+ commits = max score

    # Component 3: Issue response rate (0-1)
    triaged = sum(1 for i in issues if i["orbiter_responded"])
    response_rate = triaged / max(len(issues), 1)

    # Component 4: Bug ratio (0-1, lower bugs = higher score)
    bugs = sum(1 for c in commits if c["commit_type"] == "bug_fix")
    bug_ratio = bugs / max(len(commits), 1)
    bug_score = 1.0 - min(bug_ratio * 1.5, 0.4)

    score = (
        commit_quality * 0.35 +
        activity       * 0.25 +
        response_rate  * 0.25 +
        bug_score      * 0.15
    ) * 100

    return round(score)
```

## 3. UI Representation
The score powers the GSAP-animated radial component displayed on each repository in the `/dashboard` or `/repo/[id]` view.
- **`85 - 100`**: Green (Excellent).
- **`65 - 84`**: Amber (Moderate / Maintenance Needed).
- **`< 65`**: Red (High-Risk).
