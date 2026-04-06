"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const bootLines = [
  { text: "orbiter@main $ initializing core systems...", delay: 0 },
  { text: "[✓] ML Classifier loaded (commit_classifier.pkl)", delay: 400 },
  { text: "[✓] ChromaDB collections mounted (4 per repo)", delay: 800 },
  { text: "[✓] GitHub App webhook endpoint registered", delay: 1200 },
  { text: "[✓] HMAC-SHA256 verification enabled", delay: 1500 },
  { text: "[✓] LangChain ReAct agent initialized", delay: 1900 },
  { text: "[✓] APScheduler routines started", delay: 2200 },
  { text: "[✓] WebSocket feed ready on /api/v1/ws/feed", delay: 2500 },
  { text: "", delay: 2700 },
  { text: "✦ Orbiter is online. Watching your repos.", delay: 2800 },
];

interface TerminalLoaderProps {
  onComplete?: () => void;
}

export default function TerminalLoader({ onComplete }: TerminalLoaderProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    bootLines.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
          if (i === bootLines.length - 1 && onComplete) {
            setTimeout(onComplete, 1200);
          }
        }, line.delay)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        width: "100%",
        maxWidth: "640px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      {/* Terminal Title Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fbbf24" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399" }} />
        <span
          style={{
            marginLeft: "8px",
            fontSize: "12px",
            color: "var(--color-primary-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          orbiter — system boot
        </span>
      </div>

      {/* Terminal Content */}
      <div
        style={{
          padding: "20px",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          lineHeight: 1.8,
          minHeight: "280px",
        }}
      >
        {bootLines.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              color: line.text.startsWith("[✓]")
                ? "#34d399"
                : line.text.startsWith("✦")
                  ? "#ffffff"
                  : "var(--color-primary-muted)",
              fontWeight: line.text.startsWith("✦") ? 600 : 400,
            }}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < bootLines.length && (
          <span className="terminal-cursor" />
        )}
      </div>
    </motion.div>
  );
}
