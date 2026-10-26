"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  addShape,
  beginChange,
  deleteShape,
  MAX_K,
  MIN_K,
  moveNode,
  moveShape,
  panBy,
  redo,
  selectShape,
  setTool,
  setView,
  undo,
  updateShape,
  zoomAt,
} from "@/store/canvasSlice";
import { NODE_H, NODE_W, Shape } from "@/lib/types";
import { bbox, ICONS, newId, normalize } from "@/lib/shapes";
import Toolbar, { TOOLS } from "./Toolbar";

function ShapeView({ s }: { s: Shape }) {
  const b = bbox(s);
  const c = {
    stroke: "var(--color-paper)",
    strokeWidth: 2,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (s.kind) {
    case "rect":
      return (
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="6"
          pointerEvents="all"
          {...c}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={b.x + b.w / 2}
          cy={b.y + b.h / 2}
          rx={b.w / 2}
          ry={b.h / 2}
          pointerEvents="all"
          {...c}
        />
      );
    case "arrow":
    case "line":
      return (
        <>
          <line
            x1={s.x}
            y1={s.y}
            x2={s.x + s.w}
            y2={s.y + s.h}
            {...c}
            markerEnd={s.kind === "arrow" ? "url(#arrow-w)" : undefined}
          />
          <line
            x1={s.x}
            y1={s.y}
            x2={s.x + s.w}
            y2={s.y + s.h}
            stroke="transparent"
            strokeWidth="14"
          />
        </>
      );
    case "draw":
      return (
        <polyline
          points={(s.pts ?? [])
            .map((p) => `${s.x + p[0]},${s.y + p[1]}`)
            .join(" ")}
          {...c}
        />
      );
    case "text":
      return (
        <text x={s.x} y={s.y + 17} fill="var(--color-paper)" fontSize="16">
          {s.text}
        </text>
      );
    case "icon":
      return (
        <text x={s.x} y={s.y + 38} fontSize="40">
          {s.text}
        </text>
      );
  }
}

export default function Canvas() {
  const { nodes, edges, shapes, tool, selectedId, view, past, future } =
    useSelector((s: RootState) => s.canvas);
  const dispatch = useDispatch();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    kind: "pan" | "node" | "shape" | "create";
    id?: string;
    x: number;
    y: number;
    moved?: boolean;
  } | null>(null);
  const draftRef = useRef<Shape | null>(null);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const selected = shapes.find((s) => s.id === selectedId);

  const toWorld = (e: { clientX: number; clientY: number }) => {
    const r = svg.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - view.x) / view.k,
      y: (e.clientY - r.top - view.y) / view.k,
    };
  };
  const setDraftBoth = (s: Shape | null) => {
    draftRef.current = s;
    setDraft(s);
  };

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      dispatch(
        zoomAt({
          px: e.clientX - r.left,
          py: e.clientY - r.top,
          factor: Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)),
        }),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [dispatch]);

  // Keyboard shortcuts (V R O A L D T I, Esc, Delete) — ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
      const mod = e.metaKey || e.ctrlKey,
        k = e.key.toLowerCase();
      if (mod && k === "z") {
        e.preventDefault();
        dispatch(e.shiftKey ? redo() : undo());
        return;
      }
      if (mod && k === "y") {
        e.preventDefault();
        dispatch(redo());
        return;
      }
      if (mod || e.altKey) return;
      const t = TOOLS.find((x) => x.key === k);
      if (t) dispatch(setTool(t.id));
      else if (k === "escape") {
        dispatch(setTool("select"));
        dispatch(selectShape(null));
      } else if ((k === "delete" || k === "backspace") && selectedId)
        dispatch(deleteShape(selectedId));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, selectedId]);

  const zoomCenter = (factor: number) => {
    const r = svg.current!.getBoundingClientRect();
    dispatch(zoomAt({ px: r.width / 2, py: r.height / 2, factor }));
  };
  const fit = () => {
    const boxes = [
      ...nodes.map((n) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H })),
      ...shapes.map(bbox),
    ];
    if (!boxes.length) return;
    const r = svg.current!.getBoundingClientRect(),
      pad = 40;
    const x0 = Math.min(...boxes.map((b) => b.x)),
      x1 = Math.max(...boxes.map((b) => b.x + b.w));
    const y0 = Math.min(...boxes.map((b) => b.y)),
      y1 = Math.max(...boxes.map((b) => b.y + b.h));
    const k = Math.min(
      1.5,
      Math.max(
        MIN_K,
        Math.min(
          (r.width - pad * 2) / Math.max(1, x1 - x0),
          (r.height - pad * 2) / Math.max(1, y1 - y0),
        ),
      ),
    );
    dispatch(
      setView({
        k,
        x: (r.width - (x1 - x0) * k) / 2 - x0 * k,
        y: (r.height - (y1 - y0) * k) / 2 - y0 * k,
      }),
    );
  };
  const placeIcon = (emoji: string) => {
    const r = svg.current!.getBoundingClientRect(),
      j = (shapes.length % 5) * 14;
    dispatch(
      addShape({
        id: newId(),
        kind: "icon",
        text: emoji,
        w: 0,
        h: 0,
        x: (r.width / 2 - view.x) / view.k - 24 + j,
        y: (r.height / 2 - view.y) / view.k - 24 + j,
      }),
    );
    dispatch(setTool("select"));
  };

  const onDown = (e: React.PointerEvent) => {
    if (tool === "select" || tool === "icon") return;
    const p = toWorld(e);
    if (tool === "text") {
      const s: Shape = {
        id: newId(),
        kind: "text",
        x: p.x,
        y: p.y,
        w: 0,
        h: 0,
        text: "",
      };
      dispatch(addShape(s));
      setEditing(s.id);
      dispatch(setTool("select"));
      return;
    }
    svg.current!.setPointerCapture(e.pointerId);
    drag.current = { kind: "create", x: e.clientX, y: e.clientY };
    setDraftBoth({
      id: newId(),
      kind: tool,
      x: p.x,
      y: p.y,
      w: 0,
      h: 0,
      pts: tool === "draw" ? [[0, 0]] : undefined,
    });
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "create") {
      const s = draftRef.current!,
        p = toWorld(e);
      setDraftBoth(
        s.kind === "draw"
          ? { ...s, pts: [...(s.pts ?? []), [p.x - s.x, p.y - s.y]] }
          : { ...s, w: p.x - s.x, h: p.y - s.y },
      );
      return;
    }
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (!d.moved && d.kind !== "pan") dispatch(beginChange());
    drag.current = { ...d, moved: true, x: e.clientX, y: e.clientY };
    if (d.kind === "pan") dispatch(panBy({ dx, dy }));
    else if (d.kind === "node")
      dispatch(moveNode({ id: d.id!, dx: dx / view.k, dy: dy / view.k }));
    else dispatch(moveShape({ id: d.id!, dx: dx / view.k, dy: dy / view.k }));
  };
  const onUp = () => {
    if (drag.current?.kind === "create" && draftRef.current) {
      const s = normalize(draftRef.current);
      if (s) {
        dispatch(addShape(s));
        dispatch(selectShape(s.id));
      }
      setDraftBoth(null);
      dispatch(setTool("select"));
    }
    drag.current = null;
  };
  const grab = (e: React.PointerEvent, kind: "node" | "shape", id: string) => {
    if (tool !== "select") return;
    e.stopPropagation();
    dispatch(selectShape(kind === "shape" ? id : null));
    drag.current = { kind, id, x: e.clientX, y: e.clientY };
    svg.current?.setPointerCapture(e.pointerId);
  };

  const btn =
    "grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm hover:bg-line disabled:opacity-40";
  const editShape = shapes.find((s) => s.id === editing);
  const b = selected && bbox(selected);
  return (
    <div className="relative h-full w-full">
      <svg
        ref={svg}
        className={`h-full w-full touch-none select-none ${tool !== "select" ? "cursor-crosshair" : ""}`}
        role="img"
        aria-label="Diagram canvas"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <defs>
          <pattern
            id="dots"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${view.x} ${view.y}) scale(${view.k})`}
          >
            <circle cx="1" cy="1" r="1" fill="var(--color-line)" />
          </pattern>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill="var(--color-mute)" />
          </marker>
          <marker
            id="arrow-w"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10z" fill="var(--color-paper)" />
          </marker>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dots)"
          className={
            tool === "select" ? "cursor-grab active:cursor-grabbing" : ""
          }
          onPointerDown={(e) => {
            if (tool !== "select") return;
            dispatch(selectShape(null));
            drag.current = { kind: "pan", x: e.clientX, y: e.clientY };
            svg.current?.setPointerCapture(e.pointerId);
          }}
        />
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {edges.map((e, i) => {
            const a = byId[e.from],
              c = byId[e.to];
            if (!a || !c) return null;
            const x1 = a.x + NODE_W,
              y1 = a.y + NODE_H / 2,
              x2 = c.x,
              y2 = c.y + NODE_H / 2,
              mx = (x1 + x2) / 2;
            return (
              <path
                key={i}
                d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                fill="none"
                stroke="var(--color-mute)"
                strokeWidth="1.5"
                markerEnd="url(#arrow)"
              />
            );
          })}
          {nodes.map((n) => (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className={tool === "select" ? "cursor-move" : ""}
              onPointerDown={(e) => grab(e, "node", n.id)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx="10"
                fill="var(--color-panel)"
                stroke="var(--color-line)"
                strokeWidth="1.5"
              />
              <text
                x={NODE_W / 2}
                y={NODE_H / 2 + 5}
                textAnchor="middle"
                fill="var(--color-paper)"
                fontSize="14"
                pointerEvents="none"
              >
                {n.label}
              </text>
            </g>
          ))}
          {[...shapes, ...(draft ? [draft] : [])].map((s) =>
            s.id === editing ? null : (
              <g
                key={s.id}
                className={tool === "select" ? "cursor-move" : ""}
                onPointerDown={(e) => grab(e, "shape", s.id)}
                onDoubleClick={() => s.kind === "text" && setEditing(s.id)}
              >
                <ShapeView s={s} />
              </g>
            ),
          )}
          {b && !editing && (
            <rect
              x={b.x - 6}
              y={b.y - 6}
              width={b.w + 12}
              height={b.h + 12}
              fill="none"
              stroke="var(--color-pop)"
              strokeDasharray="4 3"
              pointerEvents="none"
            />
          )}
          {editShape && (
            <foreignObject
              x={editShape.x}
              y={editShape.y - 2}
              width="260"
              height="30"
            >
              <input
                defaultValue={editShape.text}
                aria-label="Text"
                className="w-full bg-transparent text-base text-paper outline-none"
                style={{ fontSize: 16 }}
                ref={(el) => {
                  if (el) setTimeout(() => el.focus(), 0);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === "Escape") &&
                  e.currentTarget.blur()
                }
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (v) dispatch(updateShape({ id: editShape.id, text: v }));
                  else dispatch(deleteShape(editShape.id));
                  setEditing(null);
                }}
              />
            </foreignObject>
          )}
        </g>
      </svg>
      <Toolbar />
      {tool === "icon" && (
        <div
          role="dialog"
          aria-label="Pick an icon"
          className="absolute top-3 left-[68px] z-10 grid grid-cols-4 gap-1 rounded-xl border border-line bg-panel p-2"
        >
          {ICONS.map(([emoji, name]) => (
            <button
              key={name}
              aria-label={name}
              title={name}
              onClick={() => placeIcon(emoji)}
              className="grid h-10 w-10 place-items-center rounded-lg text-xl hover:bg-line"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {!nodes.length && !shapes.length && (
        <p className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-mute">
          Describe a system below, or pick a tool to start drawing.
        </p>
      )}
      <div
        className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg border border-line bg-panel p-1"
        role="group"
        aria-label="Zoom controls"
      >
        <button
          className={btn}
          aria-label="Zoom out"
          disabled={view.k <= MIN_K}
          onClick={() => zoomCenter(1 / 1.25)}
        >
          −
        </button>
        <span className="w-12 text-center text-xs text-mute" aria-live="polite">
          {Math.round(view.k * 100)}%
        </span>
        <button
          className={btn}
          aria-label="Zoom in"
          disabled={view.k >= MAX_K}
          onClick={() => zoomCenter(1.25)}
        >
          +
        </button>
        <button
          className={btn}
          disabled={!nodes.length && !shapes.length}
          onClick={fit}
        >
          Fit
        </button>
        <button
          className={btn}
          onClick={() => dispatch(setView({ x: 0, y: 0, k: 1 }))}
        >
          Reset
        </button>
      </div>
      <div
        className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border border-line bg-panel p-1"
        role="group"
        aria-label="History"
      >
        <button
          className={btn}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          disabled={!past.length}
          onClick={() => dispatch(undo())}
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
            <path d="M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3" />
          </svg>
        </button>
        <button
          className={btn}
          aria-label="Redo (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
          disabled={!future.length}
          onClick={() => dispatch(redo())}
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
            <path d="M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
