"use client";

import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Orbit, ArrowRight, GitFork } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}
      <div className="hero-glow" style={{ top: "20%", left: "50%", transform: "translateX(-50%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: "18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <Orbit size={30} strokeWidth={1.5} />
          </motion.div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--color-primary-muted)",
              textAlign: "center",
            }}
          >
            Sign in to access your Orbiter dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="glass"
          style={{
            padding: "32px",
          }}
        >
          {/* GitHub OAuth */}
          <button
            onClick={handleGitHubLogin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "100%",
              padding: "16px 24px",
              background: "#ffffff",
              color: "#09090b",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s",
              textDecoration: "none",
            }}
          >
            <GitFork size={20} />
            Continue with GitHub
          </button>

          <div className="separator" style={{ margin: "24px 0" }} />

          <p
            style={{
              fontSize: "12px",
              color: "rgba(161,161,170,0.6)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            By continuing, you agree to Orbiter&apos;s Terms of Service.
            We&apos;ll only access public repository data.
          </p>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              fontSize: "13px",
              color: "var(--color-primary-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <ArrowRight size={12} style={{ transform: "rotate(180deg)" }} />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
