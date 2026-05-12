"use client";
import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  GitCommit,
  AlertCircle,
  Cpu,
  Database,
  ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RepoHealthScore from "@/components/RepoHealthScore";
import ActionCard from "@/components/ActionCard";
import ReindexButton from "@/components/ReindexButton";
import CommitCard from "@/components/CommitCard";
import IssueTriageCard from "@/components/IssueTriageCard";
import AnalyticsTab from "@/components/AnalyticsTab";
import CopilotChat from "@/components/CopilotChat";
import { supabase } from "@/lib/supabase";
import { getRepos, getRepoActions, getRepoCommits, getRepoIssues } from "@/lib/api";
import type { Repository, AIAction, Commit, Issue } from "@/lib/api";

export default function RepoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [repo, setRepo] = useState<Repository | null>(null);
  const [actions, setActions] = useState<AIAction[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "analytics">("activity");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          window.location.href = "/login";
          return;
        }

        const token = session.access_token;
        const [repos, repoActions, repoCommits, repoIssues] = await Promise.all([
          getRepos(token),
          getRepoActions(id, token),
          getRepoCommits(id, token),
          getRepoIssues(id, token)
        ]);

        const currentRepo = repos.find(r => r.id === id);
        if (currentRepo) setRepo(currentRepo);
        
        setActions(repoActions);
        setCommits(repoCommits);
        setIssues(repoIssues);
      } catch (err) {
        console.error("Failed to fetch repo details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: "88px", textAlign: "center", color: "var(--color-primary-muted)" }}>
          <p>Loading repository details...</p>
        </main>
      </>
    );
  }

  if (!repo) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: "88px", textAlign: "center", color: "var(--color-primary-muted)" }}>
          <p>Repository not found.</p>
          <Link href="/dashboard" style={{ color: "var(--color-primary)" }}>Back to Dashboard</Link>
        </main>
      </>
    );
  }

  const repoFullName = `${repo.owner}/${repo.repo_name}`;

  return (
    <>
      <Navbar />
      <main
        style={{
          paddingTop: "88px",
          minHeight: "100vh",
          padding: "88px var(--spacing-page) 48px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* Back + Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "32px" }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "var(--color-primary-muted)",
              textDecoration: "none",
              marginBottom: "20px",
            }}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>

          {/* Repo Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <RepoHealthScore score={repo.health_score} size={100} strokeWidth={6} />

            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {repoFullName}
                </h1>
                <a
                  href={`https://github.com/${repoFullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-primary-muted)" }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "8px",
                  flexWrap: "wrap",
                }}
              >
                {repo.is_indexed && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#34d399",
                    }}
                  >
                    <Database size={12} />
                    Indexed
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "var(--color-primary-muted)" }}>
                  Installation #{repo.installation_id}
                </span>
              </div>

              <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ReindexButton repoId={repo.id} />
                <Link
                  href={`/repo/${id}/commits`}
                  className="btn-ghost"
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  <GitCommit size={14} />
                  Commits
                </Link>
                <Link
                  href={`/repo/${id}/issues`}
                  className="btn-ghost"
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  <AlertCircle size={14} />
                  Issues
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "32px", borderBottom: "1px solid var(--color-border)" }}>
          {["activity", "analytics"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: "12px 8px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === tab ? "var(--color-primary)" : "var(--color-primary-muted)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "activity" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
            className="repo-detail-grid"
          >
          {/* Left: Commits */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <GitCommit size={16} />
                Recent Commits
              </h2>
              <Link
                href={`/repo/${id}/commits`}
                style={{
                  fontSize: "12px",
                  color: "var(--color-primary-muted)",
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>
            {commits.slice(0, 4).map((c, i) => (
              <CommitCard key={c.id} commit={c} index={i} />
            ))}
            {commits.length === 0 && (
              <p style={{ fontSize: "14px", color: "var(--color-primary-muted)", padding: "24px 0" }}>
                No commits analyzed yet.
              </p>
            )}
          </div>

          {/* Right: Issues + Actions */}
          <div>
            {/* Issues */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "17px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} />
                  Triaged Issues
                </h2>
                <Link
                  href={`/repo/${id}/issues`}
                  style={{
                    fontSize: "12px",
                    color: "var(--color-primary-muted)",
                    textDecoration: "none",
                  }}
                >
                  View all →
                </Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {issues.slice(0, 3).map((iss, i) => (
                  <IssueTriageCard key={iss.id} issue={iss} index={i} />
                ))}
                {issues.length === 0 && (
                  <p style={{ fontSize: "14px", color: "var(--color-primary-muted)", padding: "24px 0" }}>
                    No issues triaged yet.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Cpu size={16} />
                AI Actions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {actions.slice(0, 3).map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
                {actions.length === 0 && (
                  <p style={{ fontSize: "14px", color: "var(--color-primary-muted)", padding: "24px 0" }}>
                    No AI actions taken yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <AnalyticsTab repoId={id} />
        )}

        <CopilotChat repoId={id} />

        <style jsx global>{`
          @media (max-width: 800px) {
            .repo-detail-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}
