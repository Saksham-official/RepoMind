"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Webhook,
  Save,
  Check,
  Globe,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [emailFreq, setEmailFreq] = useState("daily");
  const [alertBreaking, setAlertBreaking] = useState(true);
  const [alertDuplicate, setAlertDuplicate] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Navbar />
      <main
        style={{
          paddingTop: "88px",
          minHeight: "100vh",
          padding: "88px var(--spacing-page) 48px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Settings size={22} />
            Settings
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--color-primary-muted)",
              marginBottom: "32px",
            }}
          >
            Configure notifications, webhooks, and preferences
          </p>
        </motion.div>

        <div className="separator" style={{ marginBottom: "32px" }} />

        {/* Webhook Config */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass"
          style={{ padding: "28px", marginBottom: "16px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Webhook size={18} style={{ color: "var(--color-primary-muted)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Webhook Configuration</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-primary-muted)",
                  marginBottom: "6px",
                }}
              >
                Webhook URL
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-primary-muted)",
                }}
              >
                <Globe size={14} />
                https://orbiter.koyeb.app/webhooks/github
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-primary-muted)",
                  marginBottom: "6px",
                }}
              >
                Secret Status
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "#34d399",
                }}
              >
                <Shield size={14} />
                HMAC-SHA256 verified · Secret configured
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass"
          style={{ padding: "28px", marginBottom: "16px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Bell size={18} style={{ color: "var(--color-primary-muted)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Notifications</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email Frequency */}
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-primary-muted)",
                  marginBottom: "8px",
                }}
              >
                <Mail size={14} />
                Email Digest Frequency
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["daily", "weekly", "never"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setEmailFreq(opt)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor:
                        emailFreq === opt
                          ? "rgba(255,255,255,0.2)"
                          : "var(--color-border)",
                      background:
                        emailFreq === opt ? "rgba(255,255,255,0.06)" : "transparent",
                      color: emailFreq === opt ? "#fff" : "var(--color-primary-muted)",
                      transition: "all 0.2s",
                      textTransform: "capitalize",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Toggles */}
            {[
              {
                label: "Alert on breaking changes",
                desc: "Get notified when a commit is classified as a breaking change",
                checked: alertBreaking,
                onChange: setAlertBreaking,
              },
              {
                label: "Alert on duplicate issues",
                desc: "Get notified when Orbiter detects a duplicate issue",
                checked: alertDuplicate,
                onChange: setAlertDuplicate,
              },
            ].map((toggle, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>
                    {toggle.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-primary-muted)" }}>
                    {toggle.desc}
                  </div>
                </div>
                <button
                  onClick={() => toggle.onChange(!toggle.checked)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: "100px",
                    border: "none",
                    cursor: "pointer",
                    background: toggle.checked
                      ? "#34d399"
                      : "rgba(255,255,255,0.1)",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 3,
                      left: toggle.checked ? 23 : 3,
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass"
          style={{ padding: "28px", marginBottom: "24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Clock size={18} style={{ color: "var(--color-primary-muted)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>System Status</h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { label: "Backend", value: "Koyeb", status: "online" },
              { label: "Frontend", value: "Vercel", status: "online" },
              { label: "Database", value: "Supabase", status: "online" },
              { label: "ML Model", value: "classifier.pkl", status: "loaded" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "12px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "8px",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--color-primary-muted)", marginBottom: "4px" }}>
                  {item.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>{item.value}</span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#34d399",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{
              background: saved ? "#34d399" : "#ffffff",
              color: saved ? "#ffffff" : "#09090b",
            }}
          >
            {saved ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </motion.div>
      </main>
    </>
  );
}
