import fs from "fs";
import path from "path";

function readingTime(content: string): string {
  const words = content
    .replace(/```[\s\S]*?```/g, "") // strip code blocks
    .replace(/[#*`_[\]()>~]/g, "") // strip markdown syntax chars
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

export function getReadingTime(slug: string): string {
  for (const ext of [".mdx", ".md"]) {
    const filePath = path.join(
      process.cwd(),
      "content",
      "blog",
      `${slug}${ext}`,
    );
    if (fs.existsSync(filePath)) {
      return readingTime(fs.readFileSync(filePath, "utf8"));
    }
  }
  return "—";
}
