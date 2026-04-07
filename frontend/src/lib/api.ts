/**
 * Orbiter API Client
 * Communicates with the FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ────── Types ──────────────────────────────────────────────

export interface Repository {
  id: string;
  owner: string;
  repo_name: string;
  installation_id: number;
  is_indexed: boolean;
  health_score: number;
  last_indexed_at: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface AIAction {
  id: string;
  repo_id: string;
  event_type: string;
  target_type: string;
  target_number: number;
  actions_taken: { action: string; value: string }[];
  reasoning: string;
  ml_classification: {
    type: string;
    confidence: number;
    scores: Record<string, number>;
  };
  created_at: string;
}

export interface Commit {
  id: string;
  repo_id: string;
  sha: string;
  message: string;
  author: string;
  committed_at: string;
  commit_type: string;
  confidence: number;
  is_breaking: boolean;
  agent_analysis: string;
  related_issues: number[];
  created_at: string;
}

export interface Issue {
  id: string;
  repo_id: string;
  github_issue_id: number;
  number: number;
  title: string;
  body: string;
  classified_type: string;
  confidence: number;
  is_duplicate: boolean;
  duplicate_of: number | null;
  suggested_owner: string | null;
  orbiter_responded: boolean;
  created_at: string;
}

export interface HealthCheck {
  status: string;
  message: string;
}

// ────── Endpoints ──────────────────────────────────────────

export async function getHealth(): Promise<HealthCheck> {
  return apiFetch<HealthCheck>("/api/v1/health");
}

export async function getRepos(token?: string): Promise<Repository[]> {
  return apiFetch<Repository[]>("/api/v1/repos", { token });
}

export async function getRepoActions(repoId: string, token?: string): Promise<AIAction[]> {
  return apiFetch<AIAction[]>(`/api/v1/repos/${repoId}/actions`, { token });
}

export async function getGlobalActions(token?: string): Promise<AIAction[]> {
  return apiFetch<AIAction[]>("/api/v1/repos/actions/recent", { token });
}

export async function getRepoCommits(repoId: string, token?: string): Promise<Commit[]> {
  return apiFetch<Commit[]>(`/api/v1/repos/${repoId}/commits`, { token });
}

export async function getRepoIssues(repoId: string, token?: string): Promise<Issue[]> {
  return apiFetch<Issue[]>(`/api/v1/repos/${repoId}/issues`, { token });
}

export async function reindexRepo(repoId: string, token?: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/api/v1/repos/${repoId}/reindex`, {
    method: "POST",
    token,
  });
}

export async function testML(message: string) {
  return apiFetch<{
    commit_type: string;
    confidence: number;
    scores: Record<string, number>;
  }>("/api/v1/test_ml", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
