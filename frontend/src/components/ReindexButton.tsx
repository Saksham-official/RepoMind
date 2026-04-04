"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, Check, Loader2 } from "lucide-react";

interface ReindexButtonProps {
  repoId: string;
  onReindex?: () => Promise<void>;
}

export default function ReindexButton({ repoId, onReindex }: ReindexButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handleClick = async () => {
    setState("loading");
    try {
      if (onReindex) {
        await onReindex();
      } else {
        // Simulate reindex for demo
        await new Promise((r) => setTimeout(r, 2500));
      }
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };

  return (
    <motion.button
      whileHover={{ scale: state === "idle" ? 1.02 : 1 }}
      whileTap={{ scale: state === "idle" ? 0.98 : 1 }}
      onClick={handleClick}
      disabled={state !== "idle"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        background:
          state === "done" ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
        color: state === "done" ? "#34d399" : "var(--color-primary-muted)",
        border: `1px solid ${state === "done" ? "rgba(52,211,153,0.2)" : "var(--color-border)"}`,
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: state === "idle" ? "pointer" : "default",
        transition: "all 0.3s",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {state === "idle" && (
        <>
          <RefreshCcw size={14} />
          Reindex
        </>
      )}
      {state === "loading" && (
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 size={14} />
          </motion.div>
          Indexing...
        </>
      )}
      {state === "done" && (
        <>
          <Check size={14} />
          Indexed
        </>
      )}
    </motion.button>
  );
}
