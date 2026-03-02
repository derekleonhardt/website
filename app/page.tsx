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
          <h1 className="hero-name font-display">
            Derek
            <br />
            Leonhardt
          </h1>

          <p className="hero-bio mono-muted">
            Hey, I&apos;m Derek.
            <br />I love to build and learn new things. I&apos;m interested in
            applied AI and distributed system and am currently a Software
            Engineer at Capital One.
          </p>

          <div className="hero-links">
            <span className="mono-muted">
              You can find me in DC, Florida, or here:
            </span>
            <div className="social-icons">
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
            <span className="label">Recent</span>
            <div>
              {recentItems.map((item) => {
                const inner = (
                  <>
                    <span className="font-display recent-row__title">
                      {item.title}
                    </span>
                    <span className="text-muted recent-row__meta">
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
