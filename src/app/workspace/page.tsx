"use client";
import Link from "next/link";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "motion/react";
import DocEditor from "@/components/DocEditor";
import Canvas from "@/components/Canvas";
import AiBar from "@/components/AiBar";
import { RootState } from "@/store";
import { setMode, setSplit, ViewMode } from "@/store/uiSlice";

const modes: { id: ViewMode; label: string }[] = [{ id: "doc", label: "Doc" }, { id: "both", label: "Both" }, { id: "diagram", label: "Diagram" }];

export default function Workspace() {
  const { mode, split } = useSelector((s: RootState) => s.ui);
  const dispatch = useDispatch();
  const wrap = useRef<HTMLDivElement>(null);
  const showDoc = mode !== "diagram", showDiagram = mode !== "doc", both = mode === "both";

  const resize = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    dispatch(setSplit(((clientX - r.left) / r.width) * 100));
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4 py-2 text-sm">
        <Link href="/" className="font-bold">Chalk</Link>
        <div role="tablist" aria-label="View" className="flex rounded-lg border border-line bg-panel p-1">
          {modes.map((m) => (
            <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => dispatch(setMode(m.id))}
              className={`relative rounded-md px-4 py-1 ${mode === m.id ? "text-ink" : "text-mute hover:text-paper"}`}>
              {mode === m.id && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-md bg-paper" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>
        <span />
      </header>
      <main ref={wrap} style={{ "--split": `${split}%` } as React.CSSProperties} className="flex min-h-0 flex-1 flex-col md:flex-row">
        {showDoc && (
          <section className={`min-h-0 min-w-0 ${both ? "basis-1/2 md:basis-(--split) md:grow-0 md:shrink-0" : "flex-1"}`}><DocEditor /></section>
        )}
        {both && (
          <div role="separator" aria-orientation="vertical" aria-label="Resize panels" aria-valuenow={Math.round(split)} aria-valuemin={20} aria-valuemax={80} tabIndex={0}
            className="group hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-line transition-colors hover:bg-pop focus-visible:bg-pop md:block"
            onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
            onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && resize(e.clientX)}
            onKeyDown={(e) => { if (e.key === "ArrowLeft") dispatch(setSplit(split - 2)); if (e.key === "ArrowRight") dispatch(setSplit(split + 2)); }} />
        )}
        {showDiagram && (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-line md:border-t-0">
            <div className="min-h-0 flex-1"><Canvas /></div>
            <AiBar />
          </section>
        )}
      </main>
    </div>
  );
}
