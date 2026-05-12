"use client";
import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, GitCommit } from "lucide-react";
import Navbar from "@/components/Navbar";
import CommitCard from "@/components/CommitCard";
import { getRepos, getRepoCommits } from "@/lib/api";
import type { Repository, Commit } from "@/lib/api";

export default function CommitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [repo, setRepo] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repos, repoCommits] = await Promise.all([
          getRepos(),
          getRepoCommits(id)
        ]);
        const currentRepo = repos.find(r => r.id === id);
        if (currentRepo) setRepo(currentRepo);
        setCommits(repoCommits);
      } catch (err) {
        console.error("Failed to fetch commits:", err);
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
          <p>Loading commits...</p>
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

  return (
    <>
      <Navbar />
      <main
        style={{
          paddingTop: "88px",
          minHeight: "100vh",
          padding: "88px var(--spacing-page) 48px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href={`/repo/${id}`}
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
            {repo.owner}/{repo.repo_name}
          </Link>

          <h1
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <GitCommit size={22} />
            Commit Timeline
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-primary-muted)",
              marginBottom: "32px",
            }}
          >
            ML-classified commits with confidence scores and agent analysis
          </p>
        </motion.div>

        <div className="separator" style={{ marginBottom: "32px" }} />

        {/* Timeline */}
        <div>
          {commits.map((c, i) => (
            <CommitCard key={c.id} commit={c} index={i} />
          ))}
          {commits.length === 0 && (
            <div
              className="glass"
              style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--color-primary-muted)",
              }}
            >
              <GitCommit size={32} style={{ marginBottom: "12px", opacity: 0.3 }} />
              <p>No commits analyzed yet for this repository.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
