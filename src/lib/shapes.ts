import { Shape } from "./types";
import { ICON_IDS, ICONS as ICON_DEFS, type IconId } from "./icons";

export const newId = () => "s" + Math.random().toString(36).slice(2, 9);

/** Picker list as [iconId, label] pairs. Same tuple shape as before, but the first value is now an icon id, not an emoji. */
export const ICONS: [IconId, string][] = ICON_IDS.map((id) => [
  id,
  ICON_DEFS[id].label,
]);

/** Bounding box in canvas units. */
export function bbox(s: Shape) {
  switch (s.kind) {
    case "draw": {
      const p = s.pts ?? [[0, 0]],
        xs = p.map((q) => q[0]),
        ys = p.map((q) => q[1]);
      const x0 = Math.min(...xs),
        y0 = Math.min(...ys);
      return {
        x: s.x + x0,
        y: s.y + y0,
        w: Math.max(...xs) - x0,
        h: Math.max(...ys) - y0,
      };
    }
    case "text":
      return {
        x: s.x,
        y: s.y,
        w: Math.max(40, (s.text?.length ?? 0) * 9),
        h: 24,
      };
    case "icon":
      return { x: s.x, y: s.y, w: 48, h: 48 };
    default:
      return {
        x: Math.min(s.x, s.x + s.w),
        y: Math.min(s.y, s.y + s.h),
        w: Math.abs(s.w),
        h: Math.abs(s.h),
      };
  }
}

/** Finalises a drafted shape; returns null when it is too small to keep. A bare click drops a default-sized box. */
export function normalize(s: Shape): Shape | null {
  if (s.kind === "rect" || s.kind === "ellipse") {
    if (Math.abs(s.w) < 4 && Math.abs(s.h) < 4) return { ...s, w: 120, h: 80 };
    const b = bbox(s);
    return { ...s, ...b };
  }
  if (s.kind === "arrow" || s.kind === "line")
    return Math.hypot(s.w, s.h) < 6 ? null : s;
  if (s.kind === "draw") return (s.pts?.length ?? 0) < 2 ? null : s;
  return s;
}
