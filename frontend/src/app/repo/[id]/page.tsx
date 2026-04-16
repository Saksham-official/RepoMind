"use client";

import { use } from "react";
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
import { mockRepos, mockActions, mockCommits, mockIssues } from "@/lib/mock-data";

export default function RepoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const repo = mockRepos.find((r) => r.id === id) || mockRepos[0];
  const repoActions = mockActions.filter((a) => a.repo_id === repo.id);
  const repoCommits = mockCommits.filter((c) => c.repo_id === repo.id);
  const repoIssues = mockIssues.filter((is) => is.repo_id === repo.id);

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

        <div className="separator" style={{ marginBottom: "32px" }} />

        {/* Two-column layout */}
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
            {repoCommits.slice(0, 4).map((c, i) => (
              <CommitCard key={c.id} commit={c} index={i} />
            ))}
            {repoCommits.length === 0 && (
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
                {repoIssues.slice(0, 3).map((iss, i) => (
                  <IssueTriageCard key={iss.id} issue={iss} index={i} />
                ))}
                {repoIssues.length === 0 && (
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
                {repoActions.slice(0, 3).map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
                {repoActions.length === 0 && (
                  <p style={{ fontSize: "14px", color: "var(--color-primary-muted)", padding: "24px 0" }}>
                    No AI actions taken yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

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
