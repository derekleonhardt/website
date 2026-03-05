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
    thoughts: "Pretty cool guy.",
  },
  {
    title: "Build a Large Language Model (From Scratch)",
    author: "Sebastian Raschka",
    status: "read",
    finishedYear: 2026,
    thoughts:
      "Was fun to get a deeper understanding of how these token prediction machines work.",
  },
  {
    title: "Barbarian Days: A Surfing Life",
    author: "Sebastian Raschka",
    status: "read",
    finishedYear: 2026,
    thoughts:
      'Might be my favorite book ever, have read and listened to it multiple times. An interesting blend of wanderlust, self growth, interesting characters, and a lot of surfing. How do you reconcile the pull of a lifelong pursuit into the responsibilities of everyday life? "Was surfing even what I was doing?"',
  },
  {
    title: "Shoe Dog",
    author: "Phil Knight",
    status: "read",
    finishedYear: 2026,
    thoughts:
      "Pure grit. It's insane how close Nike came to imploding so many times over. \"It's never just business. It never will be. If it ever does become just business, that will mean business is very bad.\"",
  },
];
