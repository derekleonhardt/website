import type { ReactNode } from "react";

interface PageLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  /** Content rendered outside the inner wrapper (no content-offset, full width) */
  fullWidth?: ReactNode;
}

export default function PageLayout({
  sidebar,
  children,
  maxWidth,
  fullWidth,
}: PageLayoutProps) {
  return (
    <main className="page-layout">
      {sidebar}
      <div className="page-layout__main">
        <div
          className="page-layout__inner"
          style={maxWidth ? { maxWidth } : undefined}
        >
          {children}
        </div>
        {fullWidth}
      </div>
    </main>
  );
}
