"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

interface RepoHealthScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function RepoHealthScore({
  score,
  size = 140,
  strokeWidth = 8,
  label,
}: RepoHealthScoreProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const getColor = (s: number) => {
    if (s >= 80) return "#34d399";
    if (s >= 60) return "#fbbf24";
    if (s >= 40) return "#f97316";
    return "#ef4444";
  };

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    const target = circumference - (score / 100) * circumference;

    gsap.fromTo(
      el,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: target,
        duration: 1.8,
        ease: "expo.out",
        delay: 0.3,
      }
    );

    // Animate counter
    const counter = { v: 0 };
    gsap.to(counter, {
      v: score,
      duration: 1.8,
      ease: "expo.out",
      delay: 0.3,
      onUpdate: () => setDisplayed(Math.round(counter.v)),
    });
  }, [score, circumference]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} className="health-ring">
          <circle
            className="health-ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            ref={circleRef}
            className="health-ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={getColor(score)}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${getColor(score)}40)` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(0deg)",
          }}
        >
          <span
            style={{
              fontSize: size * 0.28,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: getColor(score),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayed}
          </span>
          <span
            style={{
              fontSize: size * 0.09,
              color: "var(--color-primary-muted)",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Health
          </span>
        </div>
      </div>
      {label && (
        <span
          style={{
            fontSize: "13px",
            color: "var(--color-primary-muted)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </motion.div>
  );
}
