import { DEdge, DNode, RawDiagram } from "./types";

/** Layered left-to-right layout: a node sits one column right of its deepest parent. */
export function autoLayout({ nodes, edges }: RawDiagram): DNode[] {
  const depth: Record<string, number> = {};
  nodes.forEach((n) => (depth[n.id] = 0));
  for (let i = 0; i < nodes.length; i++)
    edges.forEach((e: DEdge) => {
      if (depth[e.from] === undefined || depth[e.to] === undefined) return;
      if (depth[e.from] + 1 < nodes.length && depth[e.to] < depth[e.from] + 1) depth[e.to] = depth[e.from] + 1;
    });
  const rows: Record<number, number> = {};
  return nodes.map((n) => {
    const d = depth[n.id], r = (rows[d] = (rows[d] ?? -1) + 1);
    return { ...n, x: 40 + d * 210, y: 40 + r * 100 };
  });
}
