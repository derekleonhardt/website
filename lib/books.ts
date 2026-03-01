export interface Book {
  title: string;
  author: string;
  status: "reading" | "read";
  finishedYear?: number;
  thoughts?: string;
}

export const books: Book[] = [
  {
    title: "Benjamin Franklin: An American Life",
    author: "Walter Isaacson",
    status: "reading",
    thoughts: "Pretty cool guy it seems.",
  },
  {
    title: "Build a Large Language Model (From Scratch)",
    author: "Sebastian Raschka",
    status: "read",
    finishedYear: 2026,
    thoughts:
      "Was fun to get a deeper understand and de-mistify the models that are changing the tech world.",
  },
];
