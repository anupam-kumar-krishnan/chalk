import { RawDiagram } from "./types";

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Diagram-as-code: each line is a chain like "Client -> API -> Database". */
export function parseArrows(text: string): RawDiagram {
  const nodes = new Map<string, string>();
  const edges: RawDiagram["edges"] = [];
  for (const line of text.split("\n")) {
    const parts = line.split(/->|=>|>/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    parts.forEach((p) => nodes.set(slug(p), p));
    for (let i = 0; i < parts.length - 1; i++) edges.push({ from: slug(parts[i]), to: slug(parts[i + 1]) });
  }
  return { nodes: [...nodes].map(([id, label]) => ({ id, label })), edges };
}

/** Pulls the first JSON object out of a model reply, tolerating code fences. */
export function extractDiagram(reply: string): RawDiagram | null {
  const m = reply.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const d = JSON.parse(m[0]);
    return Array.isArray(d.nodes) && Array.isArray(d.edges) ? d : null;
  } catch { return null; }
}
