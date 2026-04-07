"use client";

import { motion } from "framer-motion";
import { GitCommit, Clock, AlertTriangle } from "lucide-react";
import TypeBadge from "./TypeBadge";
import type { Commit } from "@/lib/api";

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface CommitCardProps {
  commit: Commit;
  index?: number;
}

export default function CommitCard({ commit, index = 0 }: CommitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{
        display: "flex",
        gap: "16px",
        position: "relative",
      }}
    >
      {/* Timeline Line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: "24px",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: commit.is_breaking ? "#f97316" : "rgba(255,255,255,0.2)",
            border: commit.is_breaking ? "2px solid #f97316" : "2px solid rgba(255,255,255,0.1)",
            boxShadow: commit.is_breaking ? "0 0 12px rgba(249,115,22,0.3)" : "none",
            flexShrink: 0,
            marginTop: "6px",
          }}
        />
        <div
          style={{
            width: "1px",
            flex: 1,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
            marginTop: "4px",
          }}
        />
      </div>

      {/* Card Content */}
      <div
        className="glass"
        style={{
          flex: 1,
          padding: "16px 20px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <TypeBadge type={commit.commit_type} confidence={commit.confidence} size="sm" />
              {commit.is_breaking && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    fontSize: "11px",
                    color: "#f97316",
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={11} />
                  BREAKING
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.9)",
                marginBottom: "8px",
              }}
            >
              {commit.message}
            </p>
            {commit.agent_analysis && (
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: "8px",
                }}
              >
                {commit.agent_analysis}
              </p>
            )}

            {/* Meta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "var(--color-primary-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <GitCommit size={12} />
                {commit.sha.slice(0, 7)}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-primary-muted)",
                }}
              >
                @{commit.author}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  color: "rgba(161,161,170,0.6)",
                }}
              >
                <Clock size={10} />
                {formatTimeAgo(commit.committed_at)}
              </span>
              {commit.related_issues.length > 0 && (
                <span style={{ fontSize: "12px", color: "var(--color-primary-muted)" }}>
                  → {commit.related_issues.map((n) => `#${n}`).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
