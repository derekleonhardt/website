"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "PROJECTS", href: "/projects" },
  { label: "WRITING", href: "/blog" },
  { label: "READING", href: "/reading" },
  { label: "PHOTOS", href: "/photography" },
];

export default function HomeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="site-sidebar">
      <Link href="/" className="site-sidebar__logo">
        DL
      </Link>

      <nav className="site-sidebar__nav">
        {links.map(({ label, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`site-sidebar__link ${
                active ? "link-accent" : "link-accent-from-muted"
              }`}
              style={active ? { color: "var(--fg)" } : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
