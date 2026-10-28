"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { updateShape } from "@/store/canvasSlice";
import { Shape } from "@/lib/types";
import {
  currentSize,
  DEFAULT_PAPER,
  FILL_STYLES,
  FillStyle,
  PALETTE,
  SIZE_KEYS,
  SIZE_NAMES,
  sizePatch,
} from "@/lib/shapeStyle";

type Pop = "style" | "size" | "link" | null;

// Small preview of a fill style in a given color (used in the picker and on the trigger button).
function Swatch({ style, color }: { style: FillStyle; color: string }) {
  const mix = (pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, transparent)`;
  const base = {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: `1.5px solid ${color}`,
    display: "block",
  } as const;
  const extra =
    style === "pastel"
      ? { background: mix(30) }
      : style === "solid"
        ? { background: color }
        : style === "shadow"
          ? { boxShadow: `3px 3px 0 ${mix(40)}` }
          : {};
  return <span style={{ ...base, ...extra }} />;
}

const caret = (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
    <path
      d="M2 3.5l3 3 3-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ShapeBar({ shape }: { shape: Shape }) {
  const dispatch = useDispatch();
  const [pop, setPop] = useState<Pop>(null);
  const root = useRef<HTMLDivElement>(null);

  const isText = shape.kind === "text";
  const canLabel = shape.kind !== "draw";
  const col = shape.color ?? DEFAULT_PAPER;
  const fill: FillStyle = shape.fill ?? "outline";
  const size = currentSize(shape);
  const current = isText ? (shape.text ?? "") : (shape.label ?? "");

  const patch = (p: Partial<Shape>) =>
    dispatch(updateShape({ id: shape.id, ...p }));

  useEffect(() => setPop(null), [shape.id]);

  // Close popovers when clicking elsewhere. Runs in the capture phase so it still fires when the canvas
  // stops propagation. Also blurs a focused input first, so an unsaved label is committed before the bar unmounts.
  useEffect(() => {
    const close = (e: PointerEvent) => {
      const el = root.current;
      if (!el || el.contains(e.target as Node)) return;
      if (el.contains(document.activeElement))
        (document.activeElement as HTMLElement).blur();
      setPop(null);
    };
    document.addEventListener("pointerdown", close, true);
    return () => document.removeEventListener("pointerdown", close, true);
  }, []);

  const commit = (raw: string) => {
    const v = raw.trim();
    if (v === current) return;
    if (isText) {
      if (v) patch({ text: v }); // text shapes can't be empty
    } else patch({ label: v || undefined });
  };

  const btn =
    "relative grid h-8 place-items-center rounded-md px-2 text-sm text-mute hover:bg-line hover:text-paper";
  const sep = <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />;
  const popBox =
    "absolute bottom-full mb-2 rounded-xl border border-line bg-panel p-2 shadow-lg";

  return (
    <div
      ref={root}
      role="toolbar"
      aria-label="Shape options"
      className="relative flex items-center gap-1 rounded-lg border border-line bg-panel p-1"
    >
      {/* text / label */}
      {canLabel && (
        <>
          {/* keyed on the committed value so undo/redo refreshes the field */}
          <input
            key={`${shape.id}:${current}`}
            defaultValue={current}
            placeholder={isText ? "Text" : "Add label"}
            aria-label={isText ? "Text" : "Label"}
            className="h-8 w-36 rounded-md border border-line bg-transparent px-2 text-sm text-paper outline-none placeholder:text-mute focus:border-pop"
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                e.currentTarget.value = current;
                e.currentTarget.blur();
              }
            }}
          />
          {sep}
        </>
      )}

      {/* link */}
      <div className="relative">
        <button
          className={`${btn} ${shape.link ? "text-paper" : ""}`}
          aria-label="Link"
          title="Link"
          aria-expanded={pop === "link"}
          onClick={() => setPop(pop === "link" ? null : "link")}
        >
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
            <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
            <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
          </svg>
          {shape.link && (
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-pop" />
          )}
        </button>
        {pop === "link" && (
          <div className={`${popBox} left-0 flex items-center gap-1`}>
            <input
              autoFocus
              defaultValue={shape.link ?? ""}
              placeholder="https://example.com"
              aria-label="Link URL"
              className="h-8 w-56 rounded-md border border-line bg-transparent px-2 text-sm text-paper outline-none placeholder:text-mute focus:border-pop"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  patch({ link: e.currentTarget.value.trim() || undefined });
                  setPop(null);
                }
                if (e.key === "Escape") setPop(null);
              }}
            />
            {shape.link && (
              <button
                className={btn}
                onClick={() => {
                  patch({ link: undefined });
                  setPop(null);
                }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {sep}

      {/* fill style + color */}
      <div className="relative">
        <button
          className={`${btn} gap-1.5`}
          aria-label="Color and style"
          title="Color and style"
          aria-expanded={pop === "style"}
          onClick={() => setPop(pop === "style" ? null : "style")}
        >
          <Swatch style={fill} color={col} />
          {caret}
        </button>
        {pop === "style" && (
          <div
            role="dialog"
            aria-label="Color and style"
            className={`${popBox} left-0 w-[236px]`}
          >
            <div className="mb-3 flex gap-1">
              {FILL_STYLES.map((f) => (
                <button
                  key={f.id}
                  title={f.name}
                  aria-label={f.name}
                  aria-pressed={fill === f.id}
                  onClick={() => patch({ fill: f.id })}
                  className={`grid h-9 flex-1 place-items-center rounded-lg ${fill === f.id ? "bg-line" : "hover:bg-line/60"}`}
                >
                  <Swatch style={f.id} color={col} />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 px-1 pb-1">
              {PALETTE.map((p) => {
                const on = (shape.color ?? null) === p.value;
                return (
                  <button
                    key={p.name}
                    title={p.name}
                    aria-label={p.name}
                    aria-pressed={on}
                    onClick={() => patch({ color: p.value ?? undefined })}
                    style={{ background: p.value ?? DEFAULT_PAPER }}
                    className={`h-6 w-6 rounded-md border ${on ? "border-paper ring-2 ring-pop" : "border-line"}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {sep}

      {/* size */}
      <div className="relative">
        <button
          className={`${btn} gap-1.5 text-paper`}
          aria-label="Size"
          title="Size"
          aria-expanded={pop === "size"}
          onClick={() => setPop(pop === "size" ? null : "size")}
        >
          {SIZE_NAMES[size]}
          {caret}
        </button>
        {pop === "size" && (
          <div
            role="listbox"
            aria-label="Size"
            className={`${popBox} right-0 flex w-32 flex-col gap-0.5`}
          >
            {SIZE_KEYS.map((k) => (
              <button
                key={k}
                role="option"
                aria-selected={size === k}
                onClick={() => {
                  if (k !== size) patch(sizePatch(shape, k));
                  setPop(null);
                }}
                className={`flex h-8 items-center justify-between rounded-md px-2 text-sm hover:bg-line ${size === k ? "text-paper" : "text-mute"}`}
              >
                {SIZE_NAMES[k]}
                {size === k && <span aria-hidden>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
