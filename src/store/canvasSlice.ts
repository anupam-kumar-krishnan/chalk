import { createSlice, current, PayloadAction } from "@reduxjs/toolkit";
import { DEdge, DNode, Shape, Tool } from "@/lib/types";

export const MIN_K = 0.25,
  MAX_K = 3;
const LIMIT = 50;
type View = { x: number; y: number; k: number };
type Snap = { nodes: DNode[]; edges: DEdge[]; shapes: Shape[] };
type State = {
  nodes: DNode[];
  edges: DEdge[];
  shapes: Shape[];
  tool: Tool;
  selectedId: string | null;
  view: View;
  past: Snap[];
  future: Snap[];
  status: "idle" | "loading" | "error";
  error?: string;
};
const initialState: State = {
  nodes: [],
  edges: [],
  shapes: [],
  tool: "select",
  selectedId: null,
  view: { x: 0, y: 0, k: 1 },
  past: [],
  future: [],
  status: "idle",
};

const snapOf = (s: State, shapes?: Shape[]): Snap => ({
  nodes: current(s.nodes),
  edges: current(s.edges),
  shapes: shapes ?? current(s.shapes),
});
/** Saves the current content so it can be undone. */
function record(s: State, shapes?: Shape[]) {
  s.past.push(snapOf(s, shapes));
  if (s.past.length > LIMIT) s.past.shift();
  s.future = [];
}
const isEmptyText = (x?: Shape) => x?.kind === "text" && !x.text;

const slice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    setDiagram: (s, a: PayloadAction<{ nodes: DNode[]; edges: DEdge[] }>) => {
      record(s);
      s.nodes = a.payload.nodes;
      s.edges = a.payload.edges;
      s.view = { x: 0, y: 0, k: 1 };
      s.status = "idle";
      s.error = undefined;
    },
    moveNode: (s, a: PayloadAction<{ id: string; dx: number; dy: number }>) => {
      const n = s.nodes.find((n) => n.id === a.payload.id);
      if (n) {
        n.x += a.payload.dx;
        n.y += a.payload.dy;
      }
    },
    clearCanvas: (s) => {
      record(s);
      s.nodes = [];
      s.edges = [];
      s.shapes = [];
      s.selectedId = null;
      s.view = { x: 0, y: 0, k: 1 };
    },
    setStatus: (
      s,
      a: PayloadAction<{ status: State["status"]; error?: string }>,
    ) => {
      s.status = a.payload.status;
      s.error = a.payload.error;
    },
    zoomAt: (
      s,
      a: PayloadAction<{ px: number; py: number; factor: number }>,
    ) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, s.view.k * a.payload.factor)),
        r = k / s.view.k;
      s.view.x = a.payload.px - (a.payload.px - s.view.x) * r;
      s.view.y = a.payload.py - (a.payload.py - s.view.y) * r;
      s.view.k = k;
    },
    panBy: (s, a: PayloadAction<{ dx: number; dy: number }>) => {
      s.view.x += a.payload.dx;
      s.view.y += a.payload.dy;
    },
    setView: (s, a: PayloadAction<View>) => {
      s.view = a.payload;
    },
    setTool: (s, a: PayloadAction<Tool>) => {
      s.tool = a.payload;
    },
    selectShape: (s, a: PayloadAction<string | null>) => {
      s.selectedId = a.payload;
    },
    addShape: (s, a: PayloadAction<Shape>) => {
      if (!isEmptyText(a.payload)) record(s);
      s.shapes.push(a.payload);
    },
    updateShape: (s, a: PayloadAction<{ id: string; text?: string }>) => {
      const sh = s.shapes.find((x) => x.id === a.payload.id);
      if (!sh) return;
      // A brand-new text box is undone by removing it, so snapshot without it.
      record(
        s,
        isEmptyText(sh)
          ? current(s.shapes).filter((x) => x.id !== sh.id)
          : undefined,
      );
      Object.assign(sh, a.payload);
    },
    moveShape: (
      s,
      a: PayloadAction<{ id: string; dx: number; dy: number }>,
    ) => {
      const sh = s.shapes.find((x) => x.id === a.payload.id);
      if (sh) {
        sh.x += a.payload.dx;
        sh.y += a.payload.dy;
      }
    },
    /** Stretch/reposition a shape during a drag. Doesn't record; call beginChange() first. */
    resizeShape: (
      s,
      a: PayloadAction<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      const sh = s.shapes.find((x) => x.id === a.payload.id);
      if (sh) Object.assign(sh, a.payload);
    },
    deleteShape: (s, a: PayloadAction<string>) => {
      if (!isEmptyText(s.shapes.find((x) => x.id === a.payload))) record(s);
      s.shapes = s.shapes.filter((x) => x.id !== a.payload);
      if (s.selectedId === a.payload) s.selectedId = null;
    },
    /** Call once when a drag starts, so the whole drag is one undo step. */
    beginChange: (s) => {
      record(s);
    },
    undo: (s) => {
      const p = current(s.past)[s.past.length - 1];
      if (!p) return;
      s.past.pop();
      s.future.push(snapOf(s));
      s.nodes = p.nodes;
      s.edges = p.edges;
      s.shapes = p.shapes;
      s.selectedId = null;
    },
    redo: (s) => {
      const f = current(s.future)[s.future.length - 1];
      if (!f) return;
      s.future.pop();
      s.past.push(snapOf(s));
      s.nodes = f.nodes;
      s.edges = f.edges;
      s.shapes = f.shapes;
      s.selectedId = null;
    },
  },
});
export const {
  setDiagram,
  moveNode,
  clearCanvas,
  setStatus,
  zoomAt,
  panBy,
  setView,
  setTool,
  selectShape,
  addShape,
  updateShape,
  moveShape,
  resizeShape,
  deleteShape,
  beginChange,
  undo,
  redo,
} = slice.actions;
export default slice.reducer;
