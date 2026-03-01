import Link from "next/link";
import HomeSidebar from "@/components/HomeSidebar";
import { projects } from "@/lib/projects";
import { posts } from "@/lib/posts";
import { FaGithub, FaLinkedin, FaXTwitter, FaEnvelope } from "react-icons/fa6";

const recentItems = [
  ...projects.slice(0, 3).map((p) => ({
    kind: "project" as const,
    title: p.title,
    href: p.href,
    meta: String(p.year),
    sortKey: `${p.year}-01-01`,
    external: true,
  })),
  ...posts.slice(0, 3).map((p) => ({
    kind: "post" as const,
    title: p.title,
    href: `/blog/${p.slug}`,
    meta: p.date,
    sortKey: p.date,
    external: false,
  })),
]
  .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
  .slice(0, 5);

const socialLinks = [
  {
    icon: FaGithub,
    href: "https://github.com/derekleonhardt",
    label: "GitHub",
  },
  {
    icon: FaLinkedin,
    href: "https://www.linkedin.com/in/derekleonhardt/",
    label: "LinkedIn",
  },
  { icon: FaXTwitter, href: "https://x.com/derekleonhardt", label: "X" },
  { icon: FaEnvelope, href: "mailto:leonhardtderek@gmail.com", label: "Email" },
];

export default function HomePage() {
  return (
    <div className="home-shell">
      <HomeSidebar />

      <div className="home-main">
        <div className="home-column">
          <h1
            className="hero-name font-display"
            style={{
              fontSize: "clamp(2.5rem, 2.5rem + 1.5vw, 3.75rem)",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              margin: 0,
              marginBottom: "1.75rem",
            }}
          >
            Derek
            <br />
            Leonhardt
          </h1>

          <p
            className="hero-bio mono-muted"
            style={{ margin: 0, marginBottom: "1.5rem" }}
          >
            Hey, I&apos;m Derek.
            <br />I love to build and learn new things, interested in applied AI
            and distributed systems. Currently a Software Engineer at Capital
            One.
          </p>

          <div
            className="hero-links"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "2.75rem",
            }}
          >
            <span className="mono-muted">
              You can find me in Washington DC, Florida, or on:
            </span>
            <div
              style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}
            >
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="link-accent-from-muted"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="hero-recents">
            <span className="label" style={{ marginBottom: "0.75rem" }}>
              Recent
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentItems.map((item) => {
                const inner = (
                  <>
                    <span
                      className="font-display"
                      style={{ fontSize: "1.25rem" }}
                    >
                      {item.title}
                    </span>
                    <span className="text-muted" style={{ fontSize: "10px" }}>
                      {item.meta} · {item.kind}
                    </span>
                  </>
                );
                return item.external ? (
                  <a
                    key={item.title}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="row-fade recent-row"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="row-fade recent-row"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
