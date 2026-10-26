"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

const flow = ["Prompt", "AI draft", "Your edits", "Shared doc"];
const features = [
  ["Docs that hold diagrams", "Write the explanation and draw the system in the same workspace."],
  ["A first draft in seconds", "Describe a flow in plain words, or point the AI at your doc."],
  ["A canvas you can move", "Drag any box. Arrows follow."],
];

export default function Landing() {
  const reduce = useReducedMotion();
  return (
    <div className="mx-auto max-w-5xl px-6">
      <nav className="flex items-center justify-between py-6">
        <span className="text-lg font-bold">Chalk</span>
        <Link href="/workspace" className="rounded-lg border border-line px-4 py-2 text-sm hover:border-pop">Open workspace</Link>
      </nav>
      <section className="py-20">
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">Explain it in words. Draw it in seconds.</h1>
        <p className="mt-6 max-w-xl text-lg text-mute">A docs and diagramming workspace where AI sketches the first draft of your architecture, and you take it from there.</p>
        <Link href="/workspace" className="mt-8 inline-block rounded-lg bg-pop px-6 py-3 font-medium text-ink">Start a doc</Link>
        <div className="mt-16 flex flex-wrap items-center gap-3" aria-label="How it works">
          {flow.map((label, i) => (
            <motion.div key={label} className="flex items-center gap-3"
              initial={reduce ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i, duration: 0.4 }}>
              <span className="rounded-lg border border-line bg-panel px-4 py-3">{label}</span>
              {i < flow.length - 1 && <svg width="28" height="10" aria-hidden><path d="M0 5H24M20 1l4 4-4 4" stroke="var(--color-mute)" fill="none" /></svg>}
            </motion.div>
          ))}
        </div>
      </section>
      <section className="grid gap-10 border-t border-line py-16 md:grid-cols-3">
        {features.map(([t, d]) => (
          <div key={t}><h2 className="text-lg font-medium">{t}</h2><p className="mt-2 text-mute">{d}</p></div>
        ))}
      </section>
    </div>
  );
}
