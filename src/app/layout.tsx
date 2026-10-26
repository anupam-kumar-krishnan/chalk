import "./globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Chalk - docs and diagrams in one place",
  description: "Write docs, sketch diagrams, let AI draw the first draft.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
