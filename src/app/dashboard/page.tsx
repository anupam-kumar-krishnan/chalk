"use client";
import Link from "next/link";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ChalkMark from "@/components/ChalkMark";

const WORKSPACE = "/workspace";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

export default function Dashboard() {
  const title = useSelector((s: RootState) => s.doc.title);
  const [copied, setCopied] = useState(false);

  // The app has one doc today, so the list shows that doc. Swap in a real list once docs are stored per user.
  const docs = [
    { id: "current", title: title.trim() || "Untitled", href: WORKSPACE },
  ];

  const invite = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${WORKSPACE}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <div className="flex h-dvh">
      {/* left panel */}
      <aside
        aria-label="Sidebar"
        className="flex w-64 shrink-0 flex-col border-r border-line bg-panel/40 p-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1 text-lg font-bold"
        >
          <ChalkMark />
          Chalk
        </Link>

        <nav aria-label="Files" className="mt-8">
          <Link
            href="/dashboard"
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-line px-3 py-2 text-sm font-medium text-paper"
          >
            <Icon>
              <rect x="4" y="4" width="7" height="7" rx="1.5" />
              <rect x="13" y="4" width="7" height="7" rx="1.5" />
              <rect x="4" y="13" width="7" height="7" rx="1.5" />
              <rect x="13" y="13" width="7" height="7" rx="1.5" />
            </Icon>
            All files
          </Link>
        </nav>

        <Link
          href={WORKSPACE}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-pop px-4 py-2.5 text-sm font-medium text-ink transition hover:opacity-90"
        >
          <Icon>
            <path d="M12 5v14M5 12h14" />
          </Icon>
          New file
        </Link>
      </aside>

      {/* right side */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-8 py-4">
          <h1 className="text-lg font-bold">All files</h1>
          <button
            onClick={invite}
            className="flex items-center gap-2 rounded-lg bg-pop px-4 py-2 text-sm font-medium text-ink transition hover:opacity-90"
          >
            <Icon>
              <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
              <path d="M21 3 10 13" />
            </Icon>
            <span aria-live="polite">{copied ? "Link copied" : "Invite"}</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="border-b border-line pb-3 text-xs font-medium tracking-wide text-mute uppercase">
            Name
          </div>
          <ul>
            {docs.map((d) => (
              <li key={d.id}>
                <Link
                  href={d.href}
                  className="flex items-center gap-3 border-b border-line px-1 py-4 hover:bg-panel"
                >
                  <span className="text-mute">
                    <Icon>
                      <path d="M7 3h7l5 5v13H7z" />
                      <path d="M14 3v5h5M10 13h6M10 17h6" />
                    </Icon>
                  </span>
                  <span className="font-medium">{d.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
