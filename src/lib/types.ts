export type DNode = { id: string; label: string; x: number; y: number };
export type DEdge = { from: string; to: string };
export type RawDiagram = {
  nodes: { id: string; label: string }[];
  edges: DEdge[];
};
export const NODE_W = 140,
  NODE_H = 48;
export type Tool =
  | "select"
  | "rect"
  | "ellipse"
  | "arrow"
  | "line"
  | "draw"
  | "text"
  | "icon";
export type Shape = {
  id: string;
  kind: Exclude<Tool, "select">;
  x: number;
  y: number;
  w: number;
  h: number;
  pts?: number[][];
  text?: string;
};
