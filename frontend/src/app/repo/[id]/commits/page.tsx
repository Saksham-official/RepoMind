"use client";

import { use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, GitCommit } from "lucide-react";
import Navbar from "@/components/Navbar";
import CommitCard from "@/components/CommitCard";
import { mockRepos, mockCommits } from "@/lib/mock-data";

export default function CommitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const repo = mockRepos.find((r) => r.id === id) || mockRepos[0];
  const commits = mockCommits.filter((c) => c.repo_id === repo.id);

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
