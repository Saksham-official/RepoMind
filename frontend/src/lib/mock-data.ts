/**
 * Mock data for frontend development & demo mode
 * This enables the frontend to function fully without a running backend
 *
 * NOTE: Mock data has been cleared to ensure dashboard shows only real data.
 */

import type { Repository, AIAction, Commit, Issue } from "./api";

export const mockRepos: Repository[] = [];
export const mockActions: AIAction[] = [];
export const mockCommits: Commit[] = [];
export const mockIssues: Issue[] = [];
export const mockWSEvents: any[] = [];
