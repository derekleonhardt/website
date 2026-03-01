import Link from "next/link";
import { posts } from "@/lib/posts";
import { getReadingTime } from "@/lib/reading-time";
import HomeSidebar from "@/components/HomeSidebar";
import PageHeader from "@/components/PageHeader";
import PageLayout from "@/components/PageLayout";

export const metadata = { title: "Writing — Derek Leonhardt" };

export default function BlogPage() {
  return (
    <PageLayout sidebar={<HomeSidebar />} maxWidth="var(--content-width)">
      <PageHeader
        title="Writing"
        description="Occasional writing on software, systems, and things I'm figuring out."
      />

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
