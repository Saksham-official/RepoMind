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
import { supabase } from "@/lib/supabase";
import type { Repository, AIAction } from "@/lib/api";



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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      
      const token = session.access_token;
      const fetchedRepos = await getRepos(token);
      const fetchedActions = await getGlobalActions(token);
      setRepos(fetchedRepos);
      setActions(fetchedActions);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setRepos([]);
      setActions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = "/login";
      } else {
        fetchDashboardData();
      }
    });

    // Listen for WebSocket events
    const unsubscribeWS = orbiterWS.onEvent((event) => {
      const refreshTypes = ["issue_triaged", "commit_analyzed", "question_answered", "repo_discovered"];
      if (refreshTypes.includes(event.type)) {
        fetchDashboardData();
      }
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeWS();
    };
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
            { label: "AI Actions", value: totalActions, icon: Cpu, sub: "all time" },
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
