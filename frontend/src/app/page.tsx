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
  Layers,
  Cpu,
  Database,
  Cloud,
  Lock,
  ExternalLink,
  ChevronRight,
  Code2,
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
  { value: "1,200+", label: "RAG_Search_Engine Files" },
];

const capabilities = [
  {
    title: "Semantic Triage",
    desc: "Understand intent beyond keywords. Orbiter reads issues like a human, identifying duplicates and relevant labels across thousands of entries.",
    features: ["Duplicate Clustering", "Automated Labeling", "Contributor Routing"],
    icon: Brain,
  },
  {
    title: "RAG-Powered Support",
    desc: "Maintainers shouldn't repeat themselves. Orbiter searches your docs and past issues to answer contributor questions instantly.",
    features: ["Context-Aware Answers", "Direct File Citations", "Issue History Search"],
    icon: Search,
  },
  {
    title: "Automated PR Guard",
    desc: "Catch breaking changes and security flaws before they hit main. Orbiter provides early feedback to contributors.",
    features: ["Inline Code Comments", "Security Flagging", "Semantic Analysis"],
    icon: Shield,
  },
];

const techStack = [
  { name: "FastAPI", role: "Backend API", icon: Zap },
  { name: "Next.js", role: "Frontend UI", icon: Layers },
  { name: "LangChain", role: "AI Orchestration", icon: Cpu },
  { name: "ChromaDB", role: "Vector Store", icon: Database },
  { name: "PostgreSQL", role: "Structured Data", icon: Database },
  { name: "GitHub Apps", role: "Integration", icon: GitFork },
];

const faqs = [
  {
    q: "How secure is Orbiter?",
    a: "Orbiter uses HMAC-SHA256 signatures to verify every webhook from GitHub. We use short-lived installation tokens and never store your personal GitHub credentials. Our infrastructure is isolated and follows security best practices.",
  },
  {
    q: "Is it free for open source?",
    a: "Absolutely. Orbiter is built for the open-source community. You can host it yourself or use our managed version for free on public repositories.",
  },
  {
    q: "Can I customize the AI's behavior?",
    a: "Yes. You can configure labels, response tones, and specific maintenance rules through the dashboard. You can also provide specific documentation files for the RAG system to prioritize.",
  },
  {
    q: "Does it support private repos?",
    a: "Yes, Orbiter can be installed on private repositories. The bot will respect all repository permissions and will only access the data it is explicitly granted.",
  },
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

      {/* ══════ The Intelligence Layer ══════ */}
      <section style={{ padding: "0 var(--spacing-page) 120px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "40px",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  marginBottom: "24px",
                }}
              >
                The intelligence layer for your repository.
              </h2>
              <p
                style={{
                  fontSize: "17px",
                  lineHeight: 1.6,
                  color: "var(--color-primary-muted)",
                  marginBottom: "40px",
                }}
              >
                Orbiter isn't just a bot. It's a context-aware system that understands your codebase as deeply as your best maintainer.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {capabilities.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      style={{
                        padding: "24px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "10px",
                            background: "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{cap.title}</h4>
                          <p style={{ fontSize: "14px", color: "var(--color-primary-muted)", lineHeight: 1.5 }}>
                            {cap.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Visual Representation of GitHub Comment */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass"
              style={{
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyItems: "center" }}>
                  <Orbit size={18} color="#000" style={{ margin: "auto" }} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>orbiter-ai <span style={{ fontWeight: 400, color: "var(--color-primary-muted)" }}>commented</span></div>
                  <div style={{ fontSize: "11px", color: "var(--color-primary-muted)" }}>2 minutes ago</div>
                </div>
                <div style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", color: "var(--color-primary-muted)" }}>BOT</div>
              </div>

              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--color-primary-muted)" }}>
                <p style={{ marginBottom: "12px" }}>Hi @contributor! 👋 I&apos;ve analyzed this issue and found a few things:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ color: "var(--color-success)" }}>●</div>
                    <div><strong>Duplicate Detected:</strong> This seems similar to <span style={{ color: "var(--color-info)" }}>#452</span>. The root cause might be the same.</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ color: "var(--color-warning)" }}>●</div>
                    <div><strong>Suggested Labels:</strong> I&apos;ve added <code>bug</code> and <code>triage-needed</code>.</div>
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", borderLeft: "4px solid var(--color-primary)" }}>
                  <p style={{ fontStyle: "italic", fontSize: "13px" }}>"The error occurs in <code>auth_client.py:L142</code> because the JWT secret is being read as bytes instead of a string."</p>
                </div>
              </div>

              <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                <div style={{ padding: "4px 10px", borderRadius: "100px", background: "rgba(52, 211, 153, 0.1)", color: "var(--color-success)", fontSize: "11px", fontWeight: 600 }}>Bug Fix Verified</div>
                <div style={{ padding: "4px 10px", borderRadius: "100px", background: "rgba(96, 165, 250, 0.1)", color: "var(--color-info)", fontSize: "11px", fontWeight: 600 }}>Triage 98% Confident</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ Tech Stack Section ══════ */}
      <section style={{ padding: "0 var(--spacing-page) 120px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "16px" }}>Built for scale. Built for speed.</h2>
            <p style={{ color: "var(--color-primary-muted)", maxWidth: "600px", margin: "0 auto" }}>Powered by a modern stack designed for high-throughput webhook processing and deep semantic understanding.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
            {techStack.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    padding: "32px",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--color-border)",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={24} style={{ color: i % 2 === 0 ? "var(--color-primary)" : "var(--color-primary-muted)" }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: 600 }}>{tech.name}</h4>
                    <p style={{ fontSize: "13px", color: "var(--color-primary-muted)" }}>{tech.role}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
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

      {/* ══════ FAQ Section ══════ */}
      <section style={{ padding: "0 var(--spacing-page) 120px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "16px" }}>Common Questions</h2>
            <p style={{ color: "var(--color-primary-muted)" }}>Everything you need to know about the AI maintainer.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: "32px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.01)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h4 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-primary)" }} />
                  {faq.q}
                </h4>
                <p style={{ fontSize: "15px", color: "var(--color-primary-muted)", lineHeight: 1.6, paddingLeft: "16px" }}>
                  {faq.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
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
