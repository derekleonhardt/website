import Link from "next/link";
import { posts } from "@/lib/posts";
import { getReadingTime } from "@/lib/reading-time";
import HomeSidebar from "@/components/HomeSidebar";
import PageLayout from "@/components/PageLayout";

export const metadata = { title: "Writing — Derek Leonhardt" };

export default function BlogPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} maxWidth="var(--content-width)">
      <div className="page-header">
        <h1>Writing</h1>
        <p>Occasional writing on software, systems, and things I&apos;m figuring out.</p>
      </div>

      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="row-fade list-row"
        >
          <div className="list-row__meta">
            <span className="text-muted list-row__date">{post.date}</span>
            <span className="text-muted list-row__reading-time">
              {getReadingTime(post.slug)}
            </span>
          </div>
          <span className="list-row__title">{post.title}</span>
        </Link>
      ))}
    </PageLayout>
  );
}
