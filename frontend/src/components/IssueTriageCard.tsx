"use client";

import { motion } from "framer-motion";
import { AlertCircle, Clock, User, Copy } from "lucide-react";
import TypeBadge from "./TypeBadge";
import type { Issue } from "@/lib/api";

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface IssueTriageCardProps {
  issue: Issue;
  index?: number;
}

export default function IssueTriageCard({ issue, index = 0 }: IssueTriageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="glass"
      style={{ padding: "20px 24px" }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                color: "var(--color-primary-muted)",
                fontWeight: 500,
              }}
            >
              #{issue.number}
            </span>
            <TypeBadge type={issue.classified_type} confidence={issue.confidence} size="sm" />
            {issue.is_duplicate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "11px",
                  color: "#6b7280",
                  background: "rgba(107,114,128,0.1)",
                  padding: "2px 8px",
                  borderRadius: "100px",
                  fontWeight: 600,
                }}
              >
                <Copy size={10} />
                Dup of #{issue.duplicate_of}
              </span>
            )}
            {issue.orbiter_responded && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#34d399",
                  flexShrink: 0,
                }}
                title="Orbiter responded"
              />
            )}
          </div>
          <h4
            style={{
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {issue.title}
          </h4>
        </div>
      </div>

      {/* Body Preview */}
      {issue.body && (
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.4)",
            marginBottom: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {issue.body}
        </p>
      )}

      {/* Footer Meta */}
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
            color: "rgba(161,161,170,0.6)",
          }}
        >
          <Clock size={10} />
          {formatTimeAgo(issue.created_at)}
        </span>
        {issue.suggested_owner && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: "var(--color-primary-muted)",
            }}
          >
            <User size={10} />@{issue.suggested_owner}
          </span>
        )}
        {issue.orbiter_responded && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "#34d399",
            }}
          >
            <AlertCircle size={10} />
            Responded
          </span>
        )}
      </div>
    </motion.div>
  );
}
