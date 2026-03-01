"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function PostSidebar({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-10% 0% -80% 0%" },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 64;
      if (nearBottom && headings.length > 0)
        setActiveId(headings[headings.length - 1].id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [headings]);

  return (
    <aside className="site-sidebar">
      <Link href="/" className="site-sidebar__logo site-sidebar__logo--tight">
        DL
      </Link>

      <Link href="/blog" className="post-sidebar__back link-accent-from-muted">
        ← writing
      </Link>

      {headings.length > 0 && (
        <nav className="post-sidebar__toc">
          {headings.map(({ id, text, level }) => (
            <a
              key={id}
              href={`#${id}`}
              className="post-sidebar__toc-link"
              style={{
                paddingLeft: level >= 3 ? "0.75rem" : 0,
                color: activeId === id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {text}
            </a>
          ))}
        </nav>
      )}
    </aside>
  );
}
