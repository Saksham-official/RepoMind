"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, GitCommit, HelpCircle, AlertTriangle, Radio } from "lucide-react";
import type { WSEvent } from "@/lib/websocket";
import { orbiterWS } from "@/lib/websocket";

const eventConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  issue_triaged: { icon: Zap, color: "#f59e0b", label: "Issue Triaged" },
  question_answered: { icon: HelpCircle, color: "#3b82f6", label: "Question Answered" },
  commit_analyzed: { icon: GitCommit, color: "#8b5cf6", label: "Commit Analyzed" },
  error: { icon: AlertTriangle, color: "#ef4444", label: "Error" },
  connected: { icon: Radio, color: "#34d399", label: "Connected" },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<WSEvent[]>([]);

  useEffect(() => {
    // 1. Connect to WebSocket
    orbiterWS.connect();

    // 2. Subscribe to events
    const unsubscribe = orbiterWS.onEvent((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 20));
    });

    return () => {
      unsubscribe();
      orbiterWS.disconnect();
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            className="pulse-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#34d399",
            }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Live Activity
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-primary-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {events.length} events
        </span>
      </div>

      {/* Event List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "400px", overflowY: "auto" }}>
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => {
            const config = eventConfig[event.type] || eventConfig.connected;
            const Icon = config.icon;
            return (
              <motion.div
                key={`${event.type}-${event.timestamp}-${i}`}
                initial={{ opacity: 0, height: 0, x: -8 }}
                animate={{ opacity: 1, height: "auto", x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: i === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  transition: "background 0.3s",
                }}
              >
                <Icon size={14} style={{ color: config.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>
                    {config.label}
                  </span>
                  {event.issue_number && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "12px",
                        color: "var(--color-primary-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      #{event.issue_number}
                    </span>
                  )}
                  {event.sha && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "12px",
                        color: "var(--color-primary-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {event.sha.slice(0, 7)}
                    </span>
                  )}
                  {event.classification && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "11px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.06)",
                        color: "var(--color-primary-muted)",
                      }}
                    >
                      {event.classification}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "rgba(161,161,170,0.5)",
                    fontFamily: "var(--font-mono)",
                    flexShrink: 0,
                  }}
                >
                  {event.timestamp ? formatTime(event.timestamp) : ""}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
