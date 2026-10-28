// lib/shapeStyle.ts — colors, fill styles and size presets shared by Canvas and ShapeBar.
import { Shape } from "@/lib/types";

export type FillStyle = "pastel" | "solid" | "outline" | "shadow";
export type SizeKey = "s" | "m" | "l";

export const DEFAULT_PAPER = "var(--color-paper)";
export const INK = "#0b0b0f"; // dark ink used on top of fully filled shapes

// value: null = the default paper color
export const PALETTE: { name: string; value: string | null }[] = [
  { name: "Default", value: null },
  { name: "Red", value: "#f87171" },
  { name: "Orange", value: "#fb923c" },
  { name: "Yellow", value: "#facc15" },
  { name: "Green", value: "#4ade80" },
  { name: "Blue", value: "#60a5fa" },
  { name: "Purple", value: "#c084fc" },
  { name: "Gray", value: "#9ca3af" },
];

export const FILL_STYLES: { id: FillStyle; name: string }[] = [
  { id: "pastel", name: "Pastel" },
  { id: "solid", name: "Full" },
  { id: "outline", name: "Outline" },
  { id: "shadow", name: "Shadow" },
];

export const SIZE_KEYS: SizeKey[] = ["s", "m", "l"];
export const SIZE_NAMES: Record<SizeKey, string> = {
  s: "Small",
  m: "Medium",
  l: "Large",
};
// "Size" means: icon box size, text font size, or stroke width for everything else.
export const ICON_SIZES: Record<SizeKey, number> = { s: 32, m: 48, l: 80 };
export const FONT_SIZES: Record<SizeKey, number> = { s: 16, m: 24, l: 40 };
export const STROKES: Record<SizeKey, number> = { s: 1.2, m: 2, l: 4 };

/** How a shape should be painted, from its color / fill / size fields. */
export function look(s: Shape) {
  const col = s.color ?? DEFAULT_PAPER;
  const f: FillStyle = s.fill ?? "outline";
  return {
    col,
    f,
    sw: STROKES[s.size ?? "m"],
    boxFill: f === "solid" || f === "pastel" ? col : "none",
    boxFillOpacity: f === "pastel" ? 0.22 : 1,
    ink: f === "solid" ? INK : DEFAULT_PAPER, // text drawn on top of the shape
    opacity: f === "pastel" ? 0.6 : 1, // for lines / arrows / text, which have no fill
    filter:
      f === "shadow"
        ? `drop-shadow(4px 5px 0 color-mix(in srgb, ${col} 35%, transparent))`
        : undefined,
  };
}

/** Index of the arrowhead marker (arrow-c0, arrow-c1, ...) matching the shape's color. */
export const markerIdx = (s: Shape) =>
  Math.max(
    0,
    PALETTE.findIndex((p) => p.value === (s.color ?? null)),
  );

const nearest = (table: Record<SizeKey, number>, v: number): SizeKey =>
  SIZE_KEYS.reduce((best, k) =>
    Math.abs(table[k] - v) < Math.abs(table[best] - v) ? k : best,
  );

/** Current size preset (icons and text are derived from their real size, so dragging handles stays in sync). */
export function currentSize(s: Shape): SizeKey {
  if (s.kind === "icon") return nearest(ICON_SIZES, s.w || 48);
  if (s.kind === "text") return nearest(FONT_SIZES, s.h || 16);
  return s.size ?? "m";
}

/** The patch that applies a size preset to a shape. */
export function sizePatch(s: Shape, k: SizeKey): Partial<Shape> {
  if (s.kind === "icon") {
    const next = ICON_SIZES[k],
      d = next - (s.w || 48);
    return { x: s.x - d / 2, y: s.y - d / 2, w: next, h: next }; // grow around the center
  }
  if (s.kind === "text") return { h: FONT_SIZES[k] }; // text keeps its font size in h
  return { size: k };
}

export const openLink = (u: string) =>
  window.open(
    /^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `https://${u}`,
    "_blank",
    "noopener,noreferrer",
  );
