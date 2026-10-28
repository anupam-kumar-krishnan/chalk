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

const modes: { id: ViewMode; label: string }[] = [
  { id: "doc", label: "Doc" },
  { id: "both", label: "Both" },
  { id: "diagram", label: "Diagram" },
];

export default function Workspace() {
  const { mode, split } = useSelector((s: RootState) => s.ui);
  const dispatch = useDispatch();
  const wrap = useRef<HTMLDivElement>(null);
  const showDoc = mode !== "diagram",
    showDiagram = mode !== "doc",
    both = mode === "both";

  const resize = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    dispatch(setSplit(((clientX - r.left) / r.width) * 100));
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4 py-2 text-sm">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <svg
            className="h-6 w-6"
            aria-hidden="true"
            fill="#FF4D6D"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <path d="M358.315,177.296L144.327,391.284c-11.609,11.609-11.609,30.497,0,42.106c10.407,10.407,26.662,11.477,38.281,3.224 l217.513-217.513L358.315,177.296z" />
            <path d="M120.715,457.001c-12.985-12.985-19.115-30.264-18.408-47.309c-17.045,0.708-34.324-5.423-47.31-18.409 c-7.435-7.435-12.61-16.283-15.556-25.685l-12.837,47.647l72.147,72.147l47.647-12.837 C136.999,469.611,128.151,464.437,120.715,457.001z" />
            <polygon points="16.583,450.447 0,512 61.552,495.417" />
            <rect
              x="361.415"
              y="30.605"
              transform="matrix(0.7071 -0.7071 0.7071 0.7071 29.1061 311.9788)"
              width="59.458"
              height="180.5"
            />
            <path d="M292.898,111.879L75.385,329.392c-8.253,11.619-7.184,27.873,3.224,38.281c11.609,11.609,30.497,11.609,42.106,0 l213.988-213.988L292.898,111.879z" />
            <path d="M500.698,63.952l-52.65-52.65c-15.07-15.07-39.502-15.07-54.573,0l-11.313,11.313l107.223,107.223l11.313-11.313 C515.768,103.455,515.768,79.023,500.698,63.952z" />
          </svg>
          Chalk
        </Link>
        <div
          role="tablist"
          aria-label="View"
          className="flex rounded-lg border border-line bg-panel p-1"
        >
          {modes.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => dispatch(setMode(m.id))}
              className={`relative rounded-md px-4 py-1 ${mode === m.id ? "text-ink" : "text-mute hover:text-paper"}`}
            >
              {mode === m.id && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-md bg-paper"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>
        <span />
      </header>
      <main
        ref={wrap}
        style={{ "--split": `${split}%` } as React.CSSProperties}
        className="flex min-h-0 flex-1 flex-col md:flex-row"
      >
        {showDoc && (
          <section
            className={`min-h-0 min-w-0 ${both ? "basis-1/2 md:basis-(--split) md:grow-0 md:shrink-0" : "flex-1"}`}
          >
            <DocEditor />
          </section>
        )}
        {both && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
            aria-valuenow={Math.round(split)}
            aria-valuemin={20}
            aria-valuemax={80}
            tabIndex={0}
            className="group hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-line transition-colors hover:bg-pop focus-visible:bg-pop md:block"
            onPointerDown={(e) =>
              e.currentTarget.setPointerCapture(e.pointerId)
            }
            onPointerMove={(e) =>
              e.currentTarget.hasPointerCapture(e.pointerId) &&
              resize(e.clientX)
            }
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") dispatch(setSplit(split - 2));
              if (e.key === "ArrowRight") dispatch(setSplit(split + 2));
            }}
          />
        )}
        {showDiagram && (
          <section className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-line md:border-t-0">
            <div className="min-h-0 flex-1">
              <Canvas />
            </div>
            <AiBar />
          </section>
        )}
      </main>
    </div>
  );
}
