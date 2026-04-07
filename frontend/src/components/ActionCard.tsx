"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GitPullRequest, MessageSquare, Tag, Clock, Cpu } from "lucide-react";
import TypeBadge from "./TypeBadge";
import type { AIAction } from "@/lib/api";

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const actionIcons: Record<string, React.ElementType> = {
  add_label: Tag,
  post_comment: MessageSquare,
  classify: Cpu,
  alert: GitPullRequest,
};

interface ActionCardProps {
  action: AIAction;
  repoName?: string;
}

export default function ActionCard({ action, repoName }: ActionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const eventLabels: Record<string, string> = {
    issue_triage: "Issue Triaged",
    contributor_help: "Question Answered",
    commit_analysis: "Commit Analyzed",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: "20px 24px", cursor: "pointer" }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Cpu size={18} style={{ color: "var(--color-primary-muted)" }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "14px" }}>
                {eventLabels[action.event_type] || action.event_type}
              </span>
              {action.target_number > 0 && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--color-primary-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  #{action.target_number}
                </span>
              )}
              <TypeBadge
                type={action.ml_classification.type}
                confidence={action.ml_classification.confidence}
                size="sm"
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "2px",
              }}
            >
              {repoName && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--color-primary-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {repoName}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "rgba(161,161,170,0.6)" }}>
                <Clock size={10} />
                {formatTimeAgo(action.created_at)}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} style={{ color: "var(--color-primary-muted)" }} />
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: "16px", marginTop: "16px", borderTop: "1px solid var(--color-border)" }}>
              {/* Reasoning */}
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-primary-muted)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  AI Reasoning
                </span>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {action.reasoning}
                </p>
              </div>

              {/* Actions Taken */}
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-primary-muted)",
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Actions Taken
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {action.actions_taken.map((a, i) => {
                    const Icon = actionIcons[a.action] || Tag;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      >
                        <Icon
                          size={14}
                          style={{ color: "var(--color-primary-muted)", marginTop: "2px", flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              color: "var(--color-primary-muted)",
                            }}
                          >
                            {a.action}
                          </span>
                          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "2px", lineHeight: 1.5 }}>
                            {a.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
