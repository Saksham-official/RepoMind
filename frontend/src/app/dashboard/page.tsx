"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitFork,
  Activity,
  Cpu,
  ArrowRight,
  ChevronRight,
  Database,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RepoHealthScore from "@/components/RepoHealthScore";
import ActionCard from "@/components/ActionCard";

import ActivityFeed from "@/components/ActivityFeed";
import { getRepos, getGlobalActions } from "@/lib/api";
import { orbiterWS } from "@/lib/websocket";
import type { Repository, AIAction } from "@/lib/api";

// ── Demo data (shown when backend has no real data yet) ──────────────────────
const DEMO_REPO: Repository = {
  id: "demo-rag",
  owner: "saksham-official",
  repo_name: "RAG_Search_Engine",
  installation_id: 0,
  is_indexed: true,
  health_score: 87,
  last_indexed_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  last_checked_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
};

const makeAction = (
  id: string,
  event_type: string,
  target_type: string,
  target_number: number,
  actions_taken: { action: string; value: string }[],
  reasoning: string,
  confidence: number,
  minsAgo: number
): AIAction => ({
  id,
  repo_id: "demo-rag",
  event_type,
  target_type,
  target_number,
  actions_taken,
  reasoning,
  ml_classification: {
    type: event_type,
    confidence,
    scores: { [event_type]: confidence, other: +(1 - confidence).toFixed(2) },
  },
  created_at: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
});

const DEMO_ACTIONS: AIAction[] = [
  makeAction(
    "da-1", "issue_triaged", "issue", 12,
    [{ action: "label", value: "bug" }, { action: "label", value: "triage-needed" }],
    "Issue #12 is a confirmed duplicate of #7. Root cause: JWT bytes vs string mismatch.",
    0.96, 8
  ),
  makeAction(
    "da-2", "question_answered", "issue", 13,
    [{ action: "comment", value: "Answered via RAG — cited retriever.py:L88" }],
    "Contributor asked about ChromaDB ingestion. Found answer in repo docs.",
    0.91, 22
  ),
  makeAction(
    "da-3", "commit_analyzed", "commit", 0,
    [{ action: "classify", value: "feature" }],
    "Commit d4f9a2c adds new embedding endpoint. No breaking changes detected.",
    0.94, 45
  ),
  makeAction(
    "da-4", "issue_triaged", "issue", 14,
    [{ action: "label", value: "enhancement" }, { action: "assign", value: "saksham-official" }],
    "Enhancement request routed to repo owner based on contributor history.",
    0.89, 90
  ),
];
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [actions, setActions] = useState<AIAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const fetchedRepos = await getRepos();
      // Merge demo repo if backend returns nothing
      setRepos(fetchedRepos.length > 0 ? fetchedRepos : [DEMO_REPO]);

      const fetchedActions = await getGlobalActions();
      // Merge demo actions if backend returns nothing
      setActions(fetchedActions.length > 0 ? fetchedActions : DEMO_ACTIONS);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      // Fallback to demo data on error
      setRepos([DEMO_REPO]);
      setActions(DEMO_ACTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for WebSocket events to update stats or lists in real-time
    const unsubscribe = orbiterWS.onEvent((event) => {
      const refreshTypes = ["issue_triaged", "commit_analyzed", "question_answered", "repo_discovered"];
      if (refreshTypes.includes(event.type)) {
        // Re-fetch or manually prepend to update the lists
        fetchDashboardData();
      }
    });

    return () => unsubscribe();
  }, []);

  const totalRepos = repos.length;
  const indexedRepos = repos.filter((r) => r.is_indexed).length;
  const avgHealth = totalRepos > 0 
    ? Math.round(repos.reduce((s, r) => s + r.health_score, 0) / totalRepos)
    : 0;
  const totalActions = actions.length;

  return (
    <>
      <Navbar />
      <main
        style={{
          paddingTop: "88px",
          minHeight: "100vh",
          padding: "88px var(--spacing-page) 48px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "40px" }}
        >
          <h1
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "15px", color: "var(--color-primary-muted)" }}>
            Monitor your repositories. Every AI action, logged and explained.
          </p>
        </motion.div>

        {/* ── Stat Cards ───────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          {[
            { label: "Repositories", value: totalRepos, icon: GitFork, sub: `${indexedRepos} indexed` },
            { label: "Avg Health", value: avgHealth, icon: Activity, sub: "across all repos" },
            { label: "AI Actions", value: totalActions, icon: Cpu, sub: "last 24h" },
            { label: "Uptime", value: "99.2%", icon: Clock, sub: "Koyeb + UptimeRobot" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass"
                style={{ padding: "24px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--color-primary-muted)",
                    }}
                  >
                    {stat.label}
                  </span>
                  <Icon size={16} style={{ color: "rgba(161,161,170,0.4)" }} />
                </div>
                <div className="stat-value" style={{ fontSize: "2rem", marginBottom: "4px" }}>
                  {stat.value}
                </div>
                <span style={{ fontSize: "12px", color: "rgba(161,161,170,0.5)" }}>
                  {stat.sub}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* ── Main Grid ────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: "24px",
          }}
          className="dashboard-grid"
        >
          {/* Left: Repos + Actions */}
          <div>
            {/* Repo List */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Repositories
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-primary-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {totalRepos} repos
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {isLoading ? (
                  <p style={{ color: "var(--color-primary-muted)", fontSize: "14px" }}>Loading repositories...</p>
                ) : repos.length === 0 ? (
                  <p style={{ color: "var(--color-primary-muted)", fontSize: "14px" }}>No repositories found. Install the GitHub App to get started.</p>
                ) : (
                  repos.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        href={`/repo/${repo.id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          className="glass"
                          style={{
                            padding: "20px 24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            cursor: "pointer",
                          }}
                        >
                          {/* Health Ring (small) */}
                          <RepoHealthScore score={repo.health_score} size={60} strokeWidth={4} />

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "15px",
                                  fontWeight: 600,
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {repo.owner}/{repo.repo_name}
                              </span>
                              {repo.is_indexed && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    fontSize: "11px",
                                    color: "#34d399",
                                    background: "rgba(52,211,153,0.08)",
                                    padding: "2px 8px",
                                    borderRadius: "100px",
                                  }}
                                >
                                  <Database size={9} />
                                  Indexed
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                fontSize: "12px",
                                color: "var(--color-primary-muted)",
                              }}
                            >
                              <span>
                                Last check: {formatDate(repo.last_checked_at)}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            size={16}
                            style={{ color: "rgba(161,161,170,0.3)", flexShrink: 0 }}
                          />
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Actions */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Recent AI Actions
                </h2>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-primary-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {actions.length} actions
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {isLoading ? (
                  <p style={{ color: "var(--color-primary-muted)", fontSize: "14px" }}>Loading actions...</p>
                ) : actions.length === 0 ? (
                  <p style={{ color: "var(--color-primary-muted)", fontSize: "14px" }}>No recent AI actions recorded.</p>
                ) : (
                  actions.slice(0, 10).map((action) => {
                    const repoName =
                      repos.find((r) => r.id === action.repo_id)?.repo_name ??
                      action.repo_id;
                    return (
                      <ActionCard
                        key={action.id}
                        action={action}
                        repoName={repoName}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Activity Feed */}
          <div>
            <div
              className="glass"
              style={{
                padding: "24px",
                position: "sticky",
                top: "88px",
              }}
            >
              <ActivityFeed />
            </div>
          </div>
        </div>

        {/* Responsive Grid Styles */}
        <style jsx global>{`
          @media (max-width: 900px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
