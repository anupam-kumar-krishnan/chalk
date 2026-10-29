"use client";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
  resizeShape,
  selectShape,
  setTool,
  setView,
  undo,
  updateShape,
  zoomAt,
} from "@/store/canvasSlice";
import { NODE_H, NODE_W, Shape } from "@/lib/types";
import { bbox, ICONS, newId, normalize } from "@/lib/shapes";
import { IconGlyph, ICONS as ICON_DEFS, resolveIconId } from "@/lib/icons";
import Toolbar, { TOOLS } from "./Toolbar";
import ShapeBar from "./ShapeBar";
import {
  DEFAULT_PAPER,
  INK,
  look,
  markerIdx,
  openLink,
  PALETTE,
} from "@/lib/shapeStyle";

// Icon sizing. Size is stored in the shape's w/h (older saved icons have w = 0 → default).
const ICON_DEFAULT = 48;
const ICON_MIN = 16;
const ICON_MAX = 512;
const SEL_PAD = 6; // gap between icon and its dashed selection box
const HANDLE_PX = 10; // resize handle size on screen (stays constant while zooming)
const ICON_STROKE = 2.5; // world units; at 48px this equals the old 1.25 * scale(2)

// Copy / paste / duplicate: how far (in world units) each pasted copy shifts.
const PASTE_OFFSET = 20;

const iconSize = (s: Shape) => s.w || ICON_DEFAULT;

// Text: font size lives in the shape's `h` (0 on older text → default).
const FONT_DEFAULT = 16;
const FONT_MIN = 8;
const FONT_MAX = 200;
const MIN_BOX = 8; // smallest rect / ellipse side
const textSize = (s: Shape) => s.h || FONT_DEFAULT;

type Handle = "nw" | "ne" | "sw" | "se" | "start" | "end";
type Rect = { x0: number; y0: number; x1: number; y1: number };

// Same as bbox(), but icons and text use their stored size, so the selection box and Fit follow resizing.
const boxOf = (s: Shape) => {
  if (s.kind === "icon")
    return { x: s.x, y: s.y, w: iconSize(s), h: iconSize(s) };
  if (s.kind === "text") {
    const fs = textSize(s);
    // approximate width: ~0.55em per character
    return {
      x: s.x,
      y: s.y,
      w: Math.max(fs * 2, (s.text?.length ?? 0) * fs * 0.55),
      h: fs * 1.3,
    };
  }
  return bbox(s);
};

function ShapeView({ s }: { s: Shape }) {
  const b = boxOf(s);
  const l = look(s);
  const c = {
    stroke: l.col,
    strokeWidth: l.sw,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let body: ReactNode = null;
  switch (s.kind) {
    case "rect":
      body = (
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="6"
          pointerEvents="all"
          {...c}
          fill={l.boxFill}
          fillOpacity={l.boxFillOpacity}
        />
      );
      break;
    case "ellipse":
      body = (
        <ellipse
          cx={b.x + b.w / 2}
          cy={b.y + b.h / 2}
          rx={b.w / 2}
          ry={b.h / 2}
          pointerEvents="all"
          {...c}
          fill={l.boxFill}
          fillOpacity={l.boxFillOpacity}
        />
      );
      break;
    case "arrow":
    case "line":
      body = (
        <>
          <line
            x1={s.x}
            y1={s.y}
            x2={s.x + s.w}
            y2={s.y + s.h}
            {...c}
            opacity={l.opacity}
            markerEnd={
              s.kind === "arrow" ? `url(#arrow-c${markerIdx(s)})` : undefined
            }
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
      break;
    case "draw":
      body = (
        <polyline
          points={(s.pts ?? [])
            .map((p) => `${s.x + p[0]},${s.y + p[1]}`)
            .join(" ")}
          {...c}
          opacity={l.opacity}
        />
      );
      break;
    case "text":
      body = (
        <text
          x={s.x}
          y={s.y + textSize(s) * 1.06}
          fill={l.col}
          opacity={l.opacity}
          fontSize={textSize(s)}
        >
          {s.text}
        </text>
      );
      break;
    case "icon": {
      const id = resolveIconId(s.text ?? "");
      const size = iconSize(s);
      // Fallback: anything that isn't a known icon id or legacy emoji draws as text, scaled with size.
      if (!id) {
        body = (
          <text
            x={s.x}
            y={s.y + size * 0.8}
            fontSize={size * 0.83}
            fill={l.col}
          >
            {s.text}
          </text>
        );
        break;
      }
      // pastel / full draw a rounded tile behind a slightly smaller glyph
      const tile = l.f === "solid" || l.f === "pastel";
      const sw = (ICON_STROKE * 24) / size; // compensates the group's scale: constant line thickness
      body = (
        <g
          transform={`translate(${s.x} ${s.y}) scale(${size / 24})`}
          fill="none"
          stroke={l.f === "solid" ? INK : l.col}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* tile, or a transparent hit area so the whole icon can be grabbed */}
          {tile ? (
            <rect
              width="24"
              height="24"
              rx="5.5"
              fill={l.col}
              fillOpacity={l.boxFillOpacity}
              stroke="none"
            />
          ) : (
            <rect width="24" height="24" fill="transparent" stroke="none" />
          )}
          <g
            transform={tile ? "translate(3.6 3.6) scale(0.7)" : undefined}
            strokeWidth={tile ? sw / 0.7 : sw}
          >
            {ICON_DEFS[id].paths.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      );
      break;
    }
  }

  // optional label (icons: under the icon, boxes: centered inside, lines: above the midpoint)
  let label: ReactNode = null;
  if (s.label && s.kind !== "text" && s.kind !== "draw") {
    let x = b.x + b.w / 2,
      y = b.y + b.h / 2 + 5;
    if (s.kind === "icon") y = b.y + b.h + 16;
    else if (s.kind === "line" || s.kind === "arrow") {
      x = s.x + s.w / 2;
      y = s.y + s.h / 2 - 8;
    }
    label = (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fontSize="13"
        pointerEvents="none"
        fill={s.kind === "rect" || s.kind === "ellipse" ? l.ink : DEFAULT_PAPER}
      >
        {s.label}
      </text>
    );
  }

  // small badge when the shape has a link; click it to open the link
  const badge = s.link ? (
    <g
      transform={`translate(${b.x + b.w + 2} ${b.y - 12})`}
      style={{ cursor: "pointer" }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => openLink(s.link!)}
    >
      <title>{s.link}</title>
      <circle r="9" fill="var(--color-panel)" stroke="var(--color-line)" />
      <path
        d="M-3 3L3 -3M-1.5 -3H3V1.5"
        fill="none"
        stroke={DEFAULT_PAPER}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  ) : null;

  return (
    <>
      <g style={l.filter ? { filter: l.filter } : undefined}>{body}</g>
      {label}
      {badge}
    </>
  );
}

export default function Canvas() {
  const { nodes, edges, shapes, tool, selectedId, view, past, future } =
    useSelector((s: RootState) => s.canvas);
  const dispatch = useDispatch();
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    kind: "pan" | "node" | "shape" | "create" | "resize" | "marquee";
    id?: string;
    x: number;
    y: number;
    moved?: boolean;
    // marquee only: ids that were already selected when Shift+drag started
    base?: string[];
    // resize only: fixed (opposite) corner in world space, and which way the dragged corner points
    rk?: "icon" | "box" | "text" | "start" | "end";
    ax?: number;
    ay?: number;
    sx?: 1 | -1;
    sy?: 1 | -1;
    w0?: number;
    h0?: number;
    fs0?: number;
  } | null>(null);
  const draftRef = useRef<Shape | null>(null);
  // Internal clipboard for Ctrl+C / Ctrl+V, plus how many times the current copy was pasted
  const clipboard = useRef<Shape[]>([]);
  const pasteN = useRef(0);
  // Space held = drag the background to pan instead of drawing a selection box
  const spaceDown = useRef(false);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  // Multi-selection. Redux still holds a single `selectedId` (so ShapeBar and the resize handles keep working).
  // When 2+ shapes are selected, they live in `group` and `selectedId` is null.
  const [group, setGroup] = useState<string[]>([]);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const marqRef = useRef<Rect | null>(null);
  const setMarqueeBoth = (m: Rect | null) => {
    marqRef.current = m;
    setMarquee(m);
  };

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const selected = shapes.find((s) => s.id === selectedId);
  // group members that still exist (they can vanish through undo / delete)
  const groupIds = group.filter((id) => shapes.some((s) => s.id === id));
  const inGroup = groupIds.length > 1;
  const currentIds = inGroup ? groupIds : selectedId ? [selectedId] : [];

  // Set the selection to any number of shapes.
  const applySelection = useCallback(
    (ids: string[]) => {
      if (ids.length >= 2) {
        setGroup(ids);
        dispatch(selectShape(null));
      } else {
        setGroup([]);
        dispatch(selectShape(ids[0] ?? null));
      }
    },
    [dispatch],
  );

  // Anything that selects a single shape (creating, pasting, clicking) leaves group mode.
  useEffect(() => {
    if (selectedId) setGroup([]);
  }, [selectedId]);

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

  // Start dragging a resize handle on the selected shape.
  // Corner handles ("nw" | "ne" | "sw" | "se") keep the opposite corner fixed.
  // Line/arrow handles ("start" | "end") keep the other endpoint fixed.
  const startResize = (e: React.PointerEvent, handle: Handle) => {
    if (!selected) return;
    e.stopPropagation();
    const bx = boxOf(selected);
    const base = {
      kind: "resize" as const,
      id: selected.id,
      x: e.clientX,
      y: e.clientY,
    };
    if (handle === "start" || handle === "end") {
      drag.current = {
        ...base,
        rk: handle,
        ax: handle === "start" ? selected.x + selected.w : selected.x,
        ay: handle === "start" ? selected.y + selected.h : selected.y,
      };
    } else {
      const sx: 1 | -1 = handle[1] === "e" ? 1 : -1;
      const sy: 1 | -1 = handle[0] === "s" ? 1 : -1;
      drag.current = {
        ...base,
        rk:
          selected.kind === "icon"
            ? "icon"
            : selected.kind === "text"
              ? "text"
              : "box",
        ax: sx > 0 ? bx.x : bx.x + bx.w,
        ay: sy > 0 ? bx.y : bx.y + bx.h,
        sx,
        sy,
        w0: bx.w,
        h0: bx.h,
        fs0: textSize(selected),
      };
    }
    svg.current?.setPointerCapture(e.pointerId);
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

  // Keyboard shortcuts (V R O A L D T I, Esc, Delete, Ctrl+Z/Y, Ctrl+A/C/V/D) — ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (/INPUT|TEXTAREA/.test(target.tagName)) return;
      const mod = e.metaKey || e.ctrlKey,
        k = e.key.toLowerCase();

      if (k === " ") spaceDown.current = true;

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

      // Select all / Copy / Paste / Duplicate
      if (mod && (k === "a" || k === "c" || k === "v" || k === "d")) {
        // leave normal shortcuts alone in the doc editor (TipTap / ProseMirror)
        if (target.closest?.("[contenteditable='true'], .ProseMirror")) return;

        // current selection, in z-order
        const grp = group.filter((id) => shapes.some((s) => s.id === id));
        const ids = grp.length > 1 ? grp : selectedId ? [selectedId] : [];
        const current = shapes.filter((s) => ids.includes(s.id));

        // Put clones of `src` on the canvas, shifted by PASTE_OFFSET * n, and select them all.
        const place = (src: Shape[], n: number) => {
          const newIds: string[] = [];
          src.forEach((s) => {
            const id = newId();
            newIds.push(id);
            dispatch(
              addShape({
                ...structuredClone(s),
                id,
                x: s.x + PASTE_OFFSET * n,
                y: s.y + PASTE_OFFSET * n,
              }),
            );
          });
          applySelection(newIds);
        };

        if (k === "a") {
          e.preventDefault();
          if (shapes.length) applySelection(shapes.map((s) => s.id));
        } else if (k === "c") {
          // don't hijack copying of highlighted text elsewhere on the page
          if (window.getSelection()?.toString()) return;
          if (!current.length) return;
          e.preventDefault();
          clipboard.current = structuredClone(current);
          pasteN.current = 0;
        } else if (k === "v") {
          if (!clipboard.current.length) return;
          e.preventDefault();
          pasteN.current += 1; // each paste lands a bit further than the last
          place(clipboard.current, pasteN.current);
        } else {
          // Ctrl+D: duplicate. preventDefault stops the browser's "bookmark this page".
          e.preventDefault();
          if (current.length) place(current, 1);
        }
        return;
      }

      if (mod || e.altKey) return;
      const t = TOOLS.find((x) => x.key === k);
      if (t) dispatch(setTool(t.id));
      else if (k === "escape") {
        dispatch(setTool("select"));
        setGroup([]);
        dispatch(selectShape(null));
      } else if (k === "delete" || k === "backspace") {
        const grp = group.filter((id) => shapes.some((s) => s.id === id));
        if (grp.length > 1) {
          grp.forEach((id) => dispatch(deleteShape(id)));
          setGroup([]);
        } else if (selectedId) dispatch(deleteShape(selectedId));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") spaceDown.current = false;
    };
    const onBlur = () => {
      spaceDown.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [dispatch, selectedId, shapes, group, applySelection]);

  const zoomCenter = (factor: number) => {
    const r = svg.current!.getBoundingClientRect();
    dispatch(zoomAt({ px: r.width / 2, py: r.height / 2, factor }));
  };
  const fit = () => {
    const boxes = [
      ...nodes.map((n) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H })),
      ...shapes.map(boxOf),
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

  const placeIcon = (iconId: string) => {
    const r = svg.current!.getBoundingClientRect(),
      j = (shapes.length % 5) * 14;
    const sid = newId();
    dispatch(
      addShape({
        id: sid,
        kind: "icon",
        text: iconId,
        w: ICON_DEFAULT,
        h: ICON_DEFAULT,
        x: (r.width / 2 - view.x) / view.k - ICON_DEFAULT / 2 + j,
        y: (r.height / 2 - view.y) / view.k - ICON_DEFAULT / 2 + j,
      }),
    );
    dispatch(selectShape(sid));
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
    if (d.kind === "marquee") {
      const m = marqRef.current;
      if (m) {
        const p = toWorld(e);
        setMarqueeBoth({ ...m, x1: p.x, y1: p.y });
      }
      return;
    }
    if (d.kind === "resize") {
      const p = toWorld(e);
      const ax = d.ax!,
        ay = d.ay!;
      let patch: { x: number; y: number; w: number; h: number };
      if (d.rk === "start") {
        patch = { x: p.x, y: p.y, w: ax - p.x, h: ay - p.y };
      } else if (d.rk === "end") {
        patch = { x: ax, y: ay, w: p.x - ax, h: p.y - ay };
      } else {
        const sx = d.sx!,
          sy = d.sy!;
        // pointer distance from the fixed corner (minus the selection padding)
        const rw = (p.x - ax) * sx - SEL_PAD,
          rh = (p.y - ay) * sy - SEL_PAD;
        if (d.rk === "icon") {
          // stay square: the axis moved further drives the size
          const size = Math.min(ICON_MAX, Math.max(ICON_MIN, Math.max(rw, rh)));
          patch = {
            x: sx > 0 ? ax : ax - size,
            y: sy > 0 ? ay : ay - size,
            w: size,
            h: size,
          };
        } else if (d.rk === "text") {
          // scale the font size with the box
          const ratio = Math.max(rw / d.w0!, rh / d.h0!);
          const fs = Math.min(FONT_MAX, Math.max(FONT_MIN, d.fs0! * ratio));
          const k = fs / d.fs0!;
          const w = d.w0! * k,
            h = d.h0! * k;
          patch = {
            x: sx > 0 ? ax : ax - w,
            y: sy > 0 ? ay : ay - h,
            w: 0,
            h: fs, // text stores its font size in h
          };
        } else {
          // rect / ellipse: free stretch
          const w = Math.max(MIN_BOX, rw),
            h = Math.max(MIN_BOX, rh);
          patch = {
            x: sx > 0 ? ax : ax - w,
            y: sy > 0 ? ay : ay - h,
            w,
            h,
          };
        }
      }
      if (!d.moved) dispatch(beginChange()); // one undo step for the whole stretch
      drag.current = { ...d, moved: true };
      dispatch(resizeShape({ id: d.id!, ...patch }));
      return;
    }
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (!d.moved && d.kind !== "pan") dispatch(beginChange());
    drag.current = { ...d, moved: true, x: e.clientX, y: e.clientY };
    if (d.kind === "pan") dispatch(panBy({ dx, dy }));
    else if (d.kind === "node")
      dispatch(moveNode({ id: d.id!, dx: dx / view.k, dy: dy / view.k }));
    else {
      // dragging one member of a multi-selection moves the whole group
      const ids = inGroup && groupIds.includes(d.id!) ? groupIds : [d.id!];
      ids.forEach((id) =>
        dispatch(moveShape({ id, dx: dx / view.k, dy: dy / view.k })),
      );
    }
  };
  const onUp = () => {
    const d = drag.current;
    if (d?.kind === "create" && draftRef.current) {
      const s = normalize(draftRef.current);
      if (s) {
        dispatch(addShape(s));
        dispatch(selectShape(s.id));
      }
      setDraftBoth(null);
      dispatch(setTool("select"));
    }
    if (d?.kind === "marquee") {
      const m = marqRef.current;
      if (m) {
        const x0 = Math.min(m.x0, m.x1),
          x1 = Math.max(m.x0, m.x1),
          y0 = Math.min(m.y0, m.y1),
          y1 = Math.max(m.y0, m.y1);
        // ignore a plain click: only box-select once the box is a few pixels big
        if (x1 - x0 > 3 / view.k || y1 - y0 > 3 / view.k) {
          const hits = shapes
            .filter((s) => {
              const q = boxOf(s);
              return (
                q.x <= x1 && q.x + q.w >= x0 && q.y <= y1 && q.y + q.h >= y0
              );
            })
            .map((s) => s.id);
          applySelection(Array.from(new Set([...(d.base ?? []), ...hits])));
        }
      }
      setMarqueeBoth(null);
    }
    drag.current = null;
  };
  const grab = (e: React.PointerEvent, kind: "node" | "shape", id: string) => {
    if (tool !== "select") return;
    e.stopPropagation();
    if (kind === "shape") {
      // Shift / Ctrl / Cmd + click toggles a shape in or out of the selection
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        applySelection(
          currentIds.includes(id)
            ? currentIds.filter((x) => x !== id)
            : [...currentIds, id],
        );
        return;
      }
      // pressing on a member of the current group keeps the group so it can be dragged together
      if (!(inGroup && groupIds.includes(id))) {
        setGroup([]);
        dispatch(selectShape(id));
      }
    } else {
      setGroup([]);
      dispatch(selectShape(null));
    }
    drag.current = { kind, id, x: e.clientX, y: e.clientY };
    svg.current?.setPointerCapture(e.pointerId);
  };

  const btn =
    "grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm hover:bg-line disabled:opacity-40";
  const editShape = shapes.find((s) => s.id === editing);
  const b = selected && boxOf(selected);
  const handles: [Handle, number, number, string][] = [];
  if (selected && b && !editing && tool === "select") {
    if (selected.kind === "line" || selected.kind === "arrow") {
      handles.push(
        ["start", selected.x, selected.y, "pointer"],
        ["end", selected.x + selected.w, selected.y + selected.h, "pointer"],
      );
    } else if (selected.kind !== "draw") {
      const x0 = b.x - SEL_PAD,
        y0 = b.y - SEL_PAD,
        x1 = b.x + b.w + SEL_PAD,
        y1 = b.y + b.h + SEL_PAD;
      handles.push(
        ["nw", x0, y0, "nwse-resize"],
        ["ne", x1, y0, "nesw-resize"],
        ["sw", x0, y1, "nesw-resize"],
        ["se", x1, y1, "nwse-resize"],
      );
    }
  }

  // dashed outlines for a multi-selection: one per shape, plus one around the whole group
  const groupBoxes = inGroup
    ? shapes.filter((s) => groupIds.includes(s.id)).map(boxOf)
    : [];
  const groupOuter = groupBoxes.length
    ? {
        x0: Math.min(...groupBoxes.map((q) => q.x)) - SEL_PAD,
        y0: Math.min(...groupBoxes.map((q) => q.y)) - SEL_PAD,
        x1: Math.max(...groupBoxes.map((q) => q.x + q.w)) + SEL_PAD,
        y1: Math.max(...groupBoxes.map((q) => q.y + q.h)) + SEL_PAD,
      }
    : null;

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
          {PALETTE.map((p, i) => (
            <marker
              key={i}
              id={`arrow-c${i}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill={p.value ?? DEFAULT_PAPER} />
            </marker>
          ))}
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#dots)"
          onPointerDown={(e) => {
            if (tool !== "select") return;
            // Space (or middle mouse) + drag pans. A plain drag draws a selection box.
            if (spaceDown.current || e.button === 1) {
              drag.current = { kind: "pan", x: e.clientX, y: e.clientY };
            } else {
              const p = toWorld(e);
              const additive = e.shiftKey || e.ctrlKey || e.metaKey;
              if (!additive) {
                setGroup([]);
                dispatch(selectShape(null));
              }
              drag.current = {
                kind: "marquee",
                x: e.clientX,
                y: e.clientY,
                base: additive ? currentIds : [],
              };
              setMarqueeBoth({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
            }
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
              x={b.x - SEL_PAD}
              y={b.y - SEL_PAD}
              width={b.w + SEL_PAD * 2}
              height={b.h + SEL_PAD * 2}
              fill="none"
              stroke="var(--color-pop)"
              strokeDasharray="4 3"
              pointerEvents="none"
            />
          )}
          {/* multi-selection outlines */}
          {!editing &&
            groupBoxes.map((q, i) => (
              <rect
                key={i}
                x={q.x - SEL_PAD}
                y={q.y - SEL_PAD}
                width={q.w + SEL_PAD * 2}
                height={q.h + SEL_PAD * 2}
                fill="none"
                stroke="var(--color-pop)"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
                pointerEvents="none"
              />
            ))}
          {!editing && groupOuter && (
            <rect
              x={groupOuter.x0 - 4}
              y={groupOuter.y0 - 4}
              width={groupOuter.x1 - groupOuter.x0 + 8}
              height={groupOuter.y1 - groupOuter.y0 + 8}
              fill="none"
              stroke="var(--color-pop)"
              strokeWidth={1.5 / view.k}
              pointerEvents="none"
            />
          )}
          {/* drag-to-select box */}
          {marquee && (
            <rect
              x={Math.min(marquee.x0, marquee.x1)}
              y={Math.min(marquee.y0, marquee.y1)}
              width={Math.abs(marquee.x1 - marquee.x0)}
              height={Math.abs(marquee.y1 - marquee.y0)}
              fill="var(--color-pop)"
              fillOpacity={0.08}
              stroke="var(--color-pop)"
              strokeWidth={1 / view.k}
              pointerEvents="none"
            />
          )}

          {handles.map(([h, cx, cy, cursor]) => {
            const hs = HANDLE_PX / view.k;
            return (
              <rect
                key={h}
                x={cx - hs / 2}
                y={cy - hs / 2}
                width={hs}
                height={hs}
                rx={hs * 0.2}
                fill="var(--color-panel)"
                stroke="var(--color-pop)"
                strokeWidth={1.5 / view.k}
                pointerEvents="all"
                style={{ cursor }}
                onPointerDown={(e) => startResize(e, h)}
              />
            );
          })}
          {editShape && (
            <foreignObject
              x={editShape.x}
              y={editShape.y - 2}
              width="260"
              height={Math.max(30, textSize(editShape) * 1.6)}
            >
              <input
                defaultValue={editShape.text}
                aria-label="Text"
                className="w-full bg-transparent text-base text-paper outline-none"
                style={{ fontSize: textSize(editShape) }}
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
          {ICONS.map(([id, name]) => (
            <button
              key={id}
              aria-label={name}
              title={name}
              onClick={() => placeIcon(id)}
              className="grid h-10 w-10 place-items-center rounded-lg text-mute hover:bg-line hover:text-paper"
            >
              <IconGlyph id={id} />
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
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <div
          className="flex items-center gap-1 rounded-lg border border-line bg-panel p-1"
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
        {selected && tool === "select" && !editing && (
          <ShapeBar shape={selected} />
        )}
      </div>
    </div>
  );
}
