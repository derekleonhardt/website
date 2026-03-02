import fs from "fs";
import path from "path";

export interface Post {
  slug: string;
  title: string;
  date: string;
}

export const posts: Post[] = [
  {
    slug: "hello-world",
    title: "Hello World",
    date: "2026-02-27",
  },
];

export function getPostContent(slug: string): string | null {
  for (const ext of [".mdx", ".md"]) {
    const filePath = path.join(
      process.cwd(),
      "content",
      "blog",
      `${slug}${ext}`,
    );
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath, "utf8");
  }
  return null;
}
