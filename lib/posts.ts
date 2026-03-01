export interface Post {
  slug: string;
  title: string;
  date: string;
}

export const posts: Post[] = [
  {
    slug: "hello-world",
    title: "Hello World",
    date: "02-27-2026",
  },
];
