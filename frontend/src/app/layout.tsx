import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbiter — AI Maintainer for Open-Source Repos",
  description:
    "An autonomous AI system that acts as a junior maintainer for any GitHub repository. Triages issues, reviews PRs, answers contributor questions — 24/7, for free.",
  keywords: ["AI", "GitHub", "open-source", "maintainer", "issue triage", "code review"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="noise-overlay" style={{ fontFamily: "var(--font-sans)" }}>
        {children}
      </body>
    </html>
  );
}
