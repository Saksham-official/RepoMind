"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  Orbit,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show nav on landing/login
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
            maxWidth: "1400px",
            margin: "12px auto 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            background: "rgba(9,9,11,0.8)",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px",
          }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <Orbit size={22} strokeWidth={1.5} />
            <span
              style={{
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Orbiter
            </span>
          </Link>

          {/* Desktop Nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            className="desktop-nav"
          >
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isActive ? "#ffffff" : "var(--color-primary-muted)",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
            <button
              className="btn-ghost"
              style={{ marginLeft: "8px" }}
              onClick={() => {
                // Simulate logout
                window.location.href = "/login";
              }}
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-menu-toggle"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mobile-nav-dropdown"
            style={{
              maxWidth: "1400px",
              margin: "8px auto 0",
              background: "rgba(9,9,11,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "12px",
              display: "none",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </motion.nav>

      <style jsx global>{`
        @media (max-width: 640px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
          .mobile-nav-dropdown {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
