"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import gsap from "gsap";
import {
  Orbit,
  Zap,
  Shield,
  Brain,
  GitPullRequest,
  ArrowRight,
  GitFork,
  MessageSquare,
  Tag,
  Search,
} from "lucide-react";
import TerminalLoader from "@/components/TerminalLoader";

const features = [
  {
    icon: Zap,
    title: "Issue Triage",
    desc: "ML-powered classification and labeling in under 15 seconds. Detects duplicates automatically.",
  },
  {
    icon: MessageSquare,
    title: "Contributor Helper",
    desc: "RAG-powered answers to contributor questions. Cites exact files and past issues.",
  },
  {
    icon: Brain,
    title: "Commit Intelligence",
    desc: "Classifies every commit — bug fix, feature, breaking change — with confidence scores.",
  },
  {
    icon: GitPullRequest,
    title: "PR Review",
    desc: "Automated inline code review comments. Security scanning. Breaking change detection.",
  },
  {
    icon: Search,
    title: "Duplicate Detection",
    desc: "ChromaDB semantic search finds duplicate issues before they waste maintainer time.",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    desc: "HMAC-SHA256 webhook verification. Short-lived tokens. Edge-level auth middleware.",
  },
];

const stats = [
  { value: "<15s", label: "Triage Time" },
  { value: "88%+", label: "ML Accuracy" },
  { value: "24/7", label: "Always On" },
  { value: "₹0", label: "Cost" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  useEffect(() => {
    if (!heroRef.current || !booted) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-title span",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: "expo.out" }
      );
      gsap.fromTo(
        ".hero-sub",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: "expo.out" }
      );
      gsap.fromTo(
        ".hero-cta",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.9, ease: "expo.out" }
      );
    }, heroRef);

    return () => ctx.revert();
  }, [booted]);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Terminal Boot Sequence */}
      {showTerminal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-surface)",
            padding: "24px",
          }}
        >
          <TerminalLoader
            onComplete={() => {
              setShowTerminal(false);
              setBooted(true);
            }}
          />
        </div>
      )}

      {/* ══════ Floating Header ══════ */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={booted ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 var(--spacing-page)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "12px auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            background: "rgba(9,9,11,0.7)",
            backdropFilter: "blur(20px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Orbit size={22} strokeWidth={1.5} />
            <span style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.03em" }}>
              Orbiter
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Link href="/login" className="btn-ghost" style={{ fontSize: "14px" }}>
              Sign In
            </Link>
            <Link href="/dashboard" className="btn-primary" style={{ padding: "10px 22px", fontSize: "14px" }}>
              Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ══════ Hero Section ══════ */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px var(--spacing-page) 80px",
          overflow: "hidden",
        }}
      >
        {/* Background Glow */}
        <div className="hero-glow" style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px" }}>
          {/* Chip */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={booted ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px 6px 8px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "100px",
              fontSize: "13px",
              color: "var(--color-primary-muted)",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                padding: "2px 8px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "100px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#fff",
              }}
            >
              NEW
            </span>
            AI Maintainer for Open-Source
          </motion.div>

          {/* Hero Title */}
          <h1
            className="hero-title"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: "24px",
              overflow: "hidden",
            }}
          >
            <span style={{ display: "block" }}>Your repos.</span>
            <span style={{ display: "block" }} className="gradient-text">
              Always maintained.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-sub"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              lineHeight: 1.6,
              color: "var(--color-primary-muted)",
              maxWidth: "640px",
              margin: "0 auto 40px",
            }}
          >
            Orbiter installs as a GitHub App and acts as your AI junior maintainer.
            It triages issues, answers questions, classifies commits, and reviews PRs — autonomously, 24/7.
          </p>

          {/* CTA */}
          <div
            className="hero-cta"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}
          >
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: "16px", padding: "14px 32px" }}>
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ fontSize: "16px", padding: "14px 32px" }}
            >
              <GitFork size={16} />
              Install App
            </a>
          </div>
        </div>
      </section>

      {/* ══════ Stats Bar ══════ */}
      <section style={{ padding: "0 var(--spacing-page)" }}>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "1px",
            background: "var(--color-border)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: "32px 24px",
                textAlign: "center",
                background: "var(--color-surface)",
              }}
            >
              <div className="stat-value">{s.value}</div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-primary-muted)",
                  marginTop: "4px",
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════ Features Grid ══════ */}
      <section style={{ padding: "120px var(--spacing-page)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "64px" }}
          >
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "16px",
              }}
            >
              Everything a maintainer needs.
            </h2>
            <p
              style={{
                fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)",
                color: "var(--color-primary-muted)",
                maxWidth: "520px",
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              From issue triage to PR review, Orbiter handles the repetitive work
              so you can focus on building.
            </p>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass"
                  style={{ padding: "32px 28px" }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Icon size={20} style={{ color: "var(--color-primary-muted)" }} />
                  </div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--color-primary-muted)",
                    }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ How It Works ══════ */}
      <section style={{ padding: "0 var(--spacing-page) 120px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: "64px" }}
          >
            <h2
              style={{
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "16px",
              }}
            >
              Three steps. That&apos;s it.
            </h2>
          </motion.div>

          {[
            {
              step: "01",
              title: "Install the GitHub App",
              desc: "One click to install Orbiter on any public GitHub repository. Fine-grained permissions — only what's needed.",
              icon: GitFork,
            },
            {
              step: "02",
              title: "Webhooks start flowing",
              desc: "GitHub pushes every issue, PR, and commit to Orbiter in real-time. HMAC-verified. Zero polling.",
              icon: Zap,
            },
            {
              step: "03",
              title: "AI takes action",
              desc: "ML classifies, RAG searches, LangChain reasons, and Orbiter writes back — labels, comments, reviews. Autonomously.",
              icon: Brain,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{
                  display: "flex",
                  gap: "24px",
                  alignItems: "flex-start",
                  marginBottom: i < 2 ? "48px" : 0,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} style={{ color: "var(--color-primary-muted)" }} />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-primary-muted)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    STEP {item.step}
                  </span>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      margin: "4px 0 8px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--color-primary-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════ CTA Section ══════ */}
      <section style={{ padding: "0 var(--spacing-page) 120px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            textAlign: "center",
            padding: "64px 32px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "16px",
            }}
          >
            Ready to automate your maintenance?
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--color-primary-muted)",
              marginBottom: "32px",
              lineHeight: 1.6,
            }}
          >
            Join the repos that never leave an issue unanswered.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: "16px", padding: "14px 36px" }}>
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* ══════ Footer ══════ */}
      <footer
        style={{
          padding: "32px var(--spacing-page)",
          borderTop: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: "13px",
            color: "var(--color-primary-muted)",
          }}
        >
          <Orbit size={14} />
          <span>Orbiter · Built with FastAPI, Next.js, LangChain, and ChromaDB</span>
        </div>
      </footer>
    </div>
  );
}
