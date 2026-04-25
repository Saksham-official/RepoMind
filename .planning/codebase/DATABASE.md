# Database Schema (Supabase/PostgreSQL)

## Tables

### `repositories`
- `id`: UUID (Primary Key)
- `github_repo_id`: BIGINT (Unique)
- `owner`: TEXT
- `repo_name`: TEXT
- `installation_id`: BIGINT
- `is_indexed`: BOOLEAN (Default: False)
- `health_score`: INTEGER (Default: 0)
- `last_indexed_at`: TIMESTAMP
- `last_checked_at`: TIMESTAMP
- `created_at`: TIMESTAMP (Default: now())

### `commits`
- `id`: UUID (Primary Key)
- `repo_id`: UUID (Foreign Key -> repositories.id)
- `sha`: TEXT (Unique per repo)
- `message`: TEXT
- `author`: TEXT
- `committed_at`: TIMESTAMP
- `classification`: TEXT (feat, fix, refactor, docs, chore, other)
- `confidence`: FLOAT
- `is_breaking`: BOOLEAN
- `agent_analysis`: TEXT (AI Reasoning)
- `related_issues`: INTEGER[]
- `created_at`: TIMESTAMP (Default: now())

### `issues`
- `id`: UUID (Primary Key)
- `repo_id`: UUID (Foreign Key -> repositories.id)
- `github_issue_id`: BIGINT
- `number`: INTEGER
- `title`: TEXT
- `body`: TEXT
- `classified_type`: TEXT (bug, feature, question, etc.)
- `confidence`: FLOAT
- `is_duplicate`: BOOLEAN
- `duplicate_of`: INTEGER
- `suggested_owner`: TEXT
- `orbiter_responded`: BOOLEAN
- `created_at`: TIMESTAMP (Default: now())

### `ai_actions`
- `id`: UUID (Primary Key)
- `repo_id`: UUID (Foreign Key -> repositories.id)
- `event_type`: TEXT (issue_triaged, pr_reviewed, comment_responded)
- `target_type`: TEXT (issue, pr, commit)
- `target_number`: INTEGER
- `actions_taken`: JSONB (List of actions like {action: "label", value: "bug"})
- `reasoning`: TEXT
- `ml_classification`: JSONB (Scores and types)
- `created_at`: TIMESTAMP (Default: now())

### `contributor_journeys`
- `id`: UUID (Primary Key)
- `repo_id`: UUID
- `username`: TEXT
- `first_contribution_at`: TIMESTAMP
- `last_contribution_at`: TIMESTAMP
- `total_contributions`: INTEGER
- `journey_stage`: TEXT (onboarding, active, core, churned)
- `mentor_notes`: TEXT
- `created_at`: TIMESTAMP

### `teach_rules`
- `id`: UUID (Primary Key)
- `repo_id`: UUID
- `rule_name`: TEXT
- `pattern`: TEXT (Regex or keyword)
- `instruction`: TEXT (Feedback for contributor)
- `is_active`: BOOLEAN
- `created_at`: TIMESTAMP

### `entity_relationships`
- `id`: UUID (Primary Key)
- `repo_id`: UUID
- `source_type`: TEXT (issue, pr, commit)
- `source_id`: TEXT (GitHub Number or Commit SHA)
- `target_type`: TEXT (issue, pr, commit)
- `target_id`: TEXT
- `relationship`: TEXT (fixes, relates_to, duplicates, depends_on)
- `created_at`: TIMESTAMP
