export interface Project {
  title: string;
  description: string;
  tags: string[];
  href: string;
  year: number;
}

export const projects: Project[] = [
  {
    title: "Homework",
    description: "A local first and AI powered save later system",
    tags: ["TypeScript", "AI", "Bookmarks"],
    href: "https://github.com/derekleonhardt/homework",
    year: 2026,
  },
];
