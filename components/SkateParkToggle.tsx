"use client";

import { useEffect, useState } from "react";
import SkatePark from "./SkatePark";

const PARK_H = "33vh";

export default function SkateParkToggle() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyS" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        style={{ height: visible ? PARK_H : 0, transition: "height 0.3s ease" }}
      />

      <div
        style={{
          position: "fixed",
          bottom: visible ? 0 : `-${PARK_H}`,
          left: "var(--sidebar-width)",
          right: 0,
          height: PARK_H,
          transition: "bottom 0.3s ease",
          zIndex: 40,
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <SkatePark />
      </div>

      <div
        className="skate-hint"
        style={visible ? { bottom: `calc(${PARK_H} + 0.5rem)` } : undefined}
      >
        press S to {visible ? "hide" : "skate"}
      </div>
    </>
  );
}
