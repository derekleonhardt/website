import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import { posts, getPostContent } from "@/lib/posts";
import PostSidebar from "@/components/PostSidebar";
import PageLayout from "@/components/PageLayout";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

// Matches rehype-slug's github-slugger output
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractHeadings(content: string): Heading[] {
  return content.split("\n").flatMap((line) => {
    const match = line.match(/^(#{2,3}) (.+)$/);
    if (!match) return [];
    const text = match[2].replace(/[*_`]/g, "");
    return [{ level: match[1].length, text, id: slugify(text) }];
  });
}

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  const content = getPostContent(slug);
  const excerpt = content
    ? content
        .replace(/^#.+$/gm, "")
        .replace(/\n+/g, " ")
        .trim()
        .slice(0, 160)
    : undefined;
  return {
    title: post ? `${post.title} — Derek Leonhardt` : "Post — Derek Leonhardt",
    description: excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  const content = getPostContent(slug);
  if (!post || !content) notFound();
  const headings = extractHeadings(content);

  return (
    <PageLayout
      sidebar={<PostSidebar headings={headings} />}
      maxWidth="var(--content-width-narrow)"
    >
      <article>
        <h1 className="post-title">{post.title}</h1>
        <div className="prose-body">
          <MDXRemote
            source={content}
            options={{ mdxOptions: { rehypePlugins: [rehypeSlug] } }}
          />
        </div>
      </article>
    </PageLayout>
  );
}
