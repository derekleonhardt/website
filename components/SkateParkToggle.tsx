"use client";

import { useEffect, useState } from "react";
import SkatePark from "./SkatePark";

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
    <div className="skate-toggle">
      <div className="skate-spacer" style={{ height: visible ? "33vh" : 0 }} />

      <div className={`skate-panel ${visible ? "skate-panel--open" : ""}`}>
        <SkatePark visible={visible} />
      </div>

      <div
        className="skate-hint"
        style={visible ? { bottom: "calc(33vh + 0.5rem)" } : undefined}
      >
        press S to {visible ? "hide" : "skate"}
      </div>
    </div>
  );
}
