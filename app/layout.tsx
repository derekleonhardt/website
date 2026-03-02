import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import SkateParkToggle from "@/components/SkateParkToggle";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://derekleonhardt.com"),
  title: "Derek Leonhardt",
  description: "Software engineer",
  openGraph: {
    title: "Derek Leonhardt",
    description: "Software engineer",
    type: "website",
  },
  twitter: { card: "summary" },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Restore saved theme before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('theme');if(t&&t!=='azure')document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className={`${cormorant.variable} ${ibmPlexMono.variable}`}>
        {children}
        <SkateParkToggle />
        <ThemeToggle />
      </body>
    </html>
  );
}
