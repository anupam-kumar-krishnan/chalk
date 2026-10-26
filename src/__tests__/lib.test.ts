import { autoLayout } from "@/lib/layout";
import { extractDiagram, parseArrows } from "@/lib/parse";
import reducer, { moveNode, setDiagram } from "@/store/canvasSlice";

test("parseArrows builds nodes and edges from chains", () => {
  const d = parseArrows("A -> B -> C\nB -> D");
  expect(d.nodes).toHaveLength(4);
  expect(d.edges).toContainEqual({ from: "b", to: "d" });
});

test("autoLayout places children to the right of parents", () => {
  const nodes = autoLayout(parseArrows("A -> B -> C"));
  expect(nodes[0].x).toBeLessThan(nodes[1].x);
  expect(nodes[1].x).toBeLessThan(nodes[2].x);
});

test("extractDiagram handles fenced JSON and rejects junk", () => {
  expect(extractDiagram('```json\n{"nodes":[],"edges":[]}\n```')).toEqual({ nodes: [], edges: [] });
  expect(extractDiagram("no json here")).toBeNull();
});

test("canvas slice sets and moves nodes", () => {
  let s = reducer(undefined, setDiagram({ nodes: [{ id: "a", label: "A", x: 0, y: 0 }], edges: [] }));
  s = reducer(s, moveNode({ id: "a", dx: 5, dy: 7 }));
  expect(s.nodes[0]).toMatchObject({ x: 5, y: 7 });
});
