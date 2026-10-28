// lib/icons.tsx — line icons for the "Insert icon" picker and the canvas.
// Every icon is plain SVG path data on a 24x24 grid, so the same data drives
// (1) React <svg> in the picker and (2) Path2D on a <canvas>.
// Stroke style matches your toolbar icons: strokeWidth 1.8, round caps and joins.

export type IconId =
  | "server"
  | "database"
  | "cache"
  | "queue"
  | "desktop"
  | "mobile"
  | "user"
  | "globe"
  | "cloud"
  | "api"
  | "settings"
  | "package"
  | "lock"
  | "mail"
  | "bell"
  | "card";

export const ICONS: Record<IconId, { label: string; paths: string[] }> = {
  server: {
    label: "Server",
    paths: [
      "M4.5 4h15A1.5 1.5 0 0 1 21 5.5v3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 8.5v-3A1.5 1.5 0 0 1 4.5 4z",
      "M4.5 14h15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-3A1.5 1.5 0 0 1 4.5 14z",
      "M7 7h.01M7 17h.01",
    ],
  },
  database: {
    label: "Database",
    paths: [
      "M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3z",
      "M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6",
      "M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6",
    ],
  },
  cache: { label: "Cache", paths: ["M13 2 4 14h7l-1 8 9-12h-7z"] },
  queue: { label: "Queue", paths: ["M3 8h18v8H3z", "M9 8v8M15 8v8"] },
  desktop: {
    label: "Web client",
    paths: [
      "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      "M8 20h8M12 16v4",
    ],
  },
  mobile: {
    label: "Mobile app",
    paths: [
      "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
      "M11 18h2",
    ],
  },
  user: {
    label: "User",
    paths: ["M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M4 21a8 8 0 0 1 16 0"],
  },
  globe: {
    label: "Internet",
    paths: [
      "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
      "M3 12h18",
      "M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
    ],
  },
  cloud: {
    label: "Cloud",
    paths: [
      "M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z",
    ],
  },
  api: { label: "API", paths: ["m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"] },
  settings: {
    label: "Settings",
    paths: [
      "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
      "M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z",
      "M18 12h2M12 18v2M4 12h2M12 4v2M16.24 16.24l1.41 1.41M7.76 16.24l-1.41 1.41M7.76 7.76 6.35 6.35M16.24 7.76l1.41-1.41",
    ],
  },
  package: {
    label: "Package",
    paths: ["M12 3 4 7v10l8 4 8-4V7z", "M4 7l8 4 8-4", "M12 11v10"],
  },
  lock: {
    label: "Auth",
    paths: [
      "M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z",
      "M8 11V8a4 4 0 0 1 8 0v3",
    ],
  },
  mail: {
    label: "Email",
    paths: [
      "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
      "m3 7 9 6 9-6",
    ],
  },
  bell: {
    label: "Notifications",
    paths: ["M6 16V11a6 6 0 0 1 12 0v5l2 2H4z", "M10 21h4"],
  },
  card: {
    label: "Payments",
    paths: [
      "M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
      "M3 10h18M7 15h4",
    ],
  },
};

export const ICON_IDS = Object.keys(ICONS) as IconId[];

// Old emoji values from saved diagrams -> new icon ids.
export const LEGACY_EMOJI: Record<string, IconId> = {
  "🗄️": "server",
  "🗄": "server",
  "🖥️": "desktop",
  "🖥": "desktop",
  "☁️": "cloud",
  "☁": "cloud",
  "👤": "user",
  "🔒": "lock",
  "🔐": "lock",
  "✉️": "mail",
  "✉": "mail",
  "📧": "mail",
  "📱": "mobile",
  "🌐": "globe",
  "⚙️": "settings",
  "⚙": "settings",
  "📦": "package",
  "🔔": "bell",
  "💳": "card",
};

export function resolveIconId(value: string): IconId | null {
  if (value in ICONS) return value as IconId;
  return LEGACY_EMOJI[value] ?? null;
}

// 1) React: use in the picker buttons and anywhere SVG is rendered.
export function IconGlyph({
  id,
  size = 22,
  className,
}: {
  id: IconId;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {ICONS[id].paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// 2) Canvas: replaces ctx.fillText(emoji, ...). x,y is the top-left corner; size is in canvas units.
const pathCache = new Map<string, Path2D>();
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  id: IconId,
  x: number,
  y: number,
  size: number,
  color = "#ece9e1",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of ICONS[id].paths) {
    let p = pathCache.get(d);
    if (!p) pathCache.set(d, (p = new Path2D(d)));
    ctx.stroke(p);
  }
  ctx.restore();
}
