"use client";

import { useEffect, useState } from "react";

const themes = [
  { id: "azure", label: "azure", accent: "#3b82f6" },
  { id: "parchment", label: "parchment", accent: "#b05c3a" },
  { id: "midnight", label: "midnight", accent: "#c4753c" },
  { id: "forest", label: "forest", accent: "#72aa60" },
] as const;

type ThemeId = (typeof themes)[number]["id"];

export default function ThemeToggle({ className }: { className?: string }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeId | null;
    const i = themes.findIndex((t) => t.id === saved);
    if (i < 0) return;
    const raf = window.requestAnimationFrame(() => setIdx(i));
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const { id } = themes[idx];
    if (id === "azure") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", id);
    }
    localStorage.setItem("theme", id);
  }, [idx]);

  const cycle = () => {
    document.documentElement.classList.add("theme-fade");
    setIdx((i) => (i + 1) % themes.length);
    setTimeout(
      () => document.documentElement.classList.remove("theme-fade"),
      300,
    );
  };

  const { label, accent } = themes[idx];

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to cycle.`}
      className={`theme-toggle${className ? ` ${className}` : ""}`}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: accent,
          display: "block",
          flexShrink: 0,
          transition: "background-color 0.25s ease",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "10px",
          letterSpacing: "0.1em",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
