import canvas, { MAX_K, setDiagram, zoomAt, panBy } from "@/store/canvasSlice";
import ui, { setMode, setSplit } from "@/store/uiSlice";

test("zoomAt keeps the cursor point fixed and clamps", () => {
  let s = canvas(undefined, zoomAt({ px: 100, py: 50, factor: 2 }));
  expect(s.view).toEqual({ k: 2, x: -100, y: -50 });
  s = canvas(s, zoomAt({ px: 0, py: 0, factor: 100 }));
  expect(s.view.k).toBe(MAX_K);
});

test("panBy moves the view; new diagram resets it", () => {
  let s = canvas(undefined, panBy({ dx: 10, dy: -5 }));
  expect(s.view).toMatchObject({ x: 10, y: -5 });
  s = canvas(s, setDiagram({ nodes: [], edges: [] }));
  expect(s.view).toEqual({ x: 0, y: 0, k: 1 });
});

test("ui slice switches mode and clamps the split", () => {
  let s = ui(undefined, setMode("doc"));
  expect(s.mode).toBe("doc");
  expect(ui(s, setSplit(5)).split).toBe(20);
  expect(ui(s, setSplit(95)).split).toBe(80);
});
