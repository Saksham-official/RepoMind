"use client";

import { motion } from "framer-motion";
import {
  Bug,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  FileText,
  RefreshCcw,
  FlaskConical,
  Copy,
} from "lucide-react";

const badgeConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  bug: {
    label: "Bug",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    icon: Bug,
  },
  bug_fix: {
    label: "Bug Fix",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
    icon: Bug,
  },
  feature: {
    label: "Feature",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.10)",
    icon: Sparkles,
  },
  question: {
    label: "Question",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.10)",
    icon: HelpCircle,
  },
  breaking_change: {
    label: "Breaking",
    color: "#f97316",
    bg: "rgba(249,115,22,0.10)",
    icon: AlertTriangle,
  },
  docs: {
    label: "Docs",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.10)",
    icon: FileText,
  },
  refactor: {
    label: "Refactor",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.10)",
    icon: RefreshCcw,
  },
  test: {
    label: "Test",
    color: "#14b8a6",
    bg: "rgba(20,184,166,0.10)",
    icon: FlaskConical,
  },
  duplicate: {
    label: "Duplicate",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.10)",
    icon: Copy,
  },
};

interface TypeBadgeProps {
  type: string;
  confidence?: number;
  size?: "sm" | "md" | "lg";
}

export default function TypeBadge({ type, confidence, size = "md" }: TypeBadgeProps) {
  const config = badgeConfig[type] || badgeConfig.feature;
  const Icon = config.icon;

  const sizeStyles = {
    sm: { padding: "3px 8px", fontSize: "11px", iconSize: 10 },
    md: { padding: "4px 12px", fontSize: "12px", iconSize: 12 },
    lg: { padding: "6px 16px", fontSize: "13px", iconSize: 14 },
  };

  const s = sizeStyles[size];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: s.padding,
        background: config.bg,
        color: config.color,
        borderRadius: "100px",
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        border: `1px solid ${config.color}22`,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={s.iconSize} />
      {config.label}
      {confidence !== undefined && (
        <span style={{ opacity: 0.6, fontWeight: 400 }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </motion.span>
  );
}
