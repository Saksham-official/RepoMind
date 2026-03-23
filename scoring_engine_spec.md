# Scoring Engine Spec

RepoMind calculates a dynamically adjusting "Repo Health Score" (from 0 to 100). The formula is meant to accurately reflect recent commit characteristics to distinguish healthy refactoring/maintenance from high-risk regressions.

## 1. Parameters Analyzed
The score applies a sliding window of recent commits (default 30 days window context).
- **Total Commit Volume**: Total valid commits recorded in the timeframe.
- **Breaking Changes**: Count of commits flagged natively as `is_breaking` (from ML or explicit title tagging).
- **Bugs**: Count of `bug_fix` commits derived from the ML classifier.
- **Features**: Count of `feature` commits derived from the ML classifier.
- **Maintenance / Docs**: Count of `docs` and `refactor` commits derived from the ML classifier.

## 2. Algorithmic Breakdown
The formula distributes the score base equally onto scaled component multipliers out of 100 total capacity.

1. **Activity Score (30%)**
   - Assesses the general vibrance of project momentum.
   - `activity_score = min(total / 20.0, 1.0)` (Caps at 20 commits for 100% of this section).

2. **Breaking Penalty (35%)**
   - Heavily penalizes unexpected or rampant breaking shifts natively.
   - `breaking_penalty = 1.0 - min(breaking / total, 0.3)`

3. **Quality / Bug Score (25%)**
   - Ratios bugs iteratively. Many bugs degrade the quality confidence metric.
   - `quality_score = 1.0 - min((bugs / total) * 0.5, 0.4)` (The penalty is capped).

4. **Maintenance Score (10%)**
   - Evaluates positive documentation and refactoring behaviors.
   - `maintenance_score = min((docs / total) * 3, 1.0)`

## 3. Execution Example
```python
def calculate_health_score(repo_id: str, days: int = 30) -> int:
    commits = get_recent_commits(repo_id, days)
    if not commits: return 50  # Baseline static neutral
    
    total = len(commits)
    breaking = sum(1 for c in commits if c["is_breaking"])
    bugs = sum(1 for c in commits if c["commit_type"] == "bug_fix")
    docs = sum(1 for c in commits if c["commit_type"] == "docs")
    
    activity_score = min(total / 20, 1.0)
    breaking_penalty = 1.0 - min(breaking / total, 0.3)
    quality_score = 1.0 - min((bugs / total) * 0.5, 0.4)
    maintenance_score = min((docs / total) * 3, 1.0)
    
    score = (
        activity_score * 0.30 +
        breaking_penalty * 0.35 +
        quality_score * 0.25 +
        maintenance_score * 0.10
    ) * 100
    
    return round(score)
```

## 4. UI Representation
The value directly correlates to a GSAP-animated radial component mapped visually to colors.
- **`85 - 100`**: Green (Excellent).
- **`65 - 84`**: Amber (Moderate / Maintenance Needed).
- **`< 65`**: Red (High-Risk).
