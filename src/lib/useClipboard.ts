import { useEffect, useRef } from "react";
import type { Shape } from "./types";
import { newId } from "./shapes";

const OFFSET = 20;

type Args = {
  shapes: Shape[];
  selectedIds: string[];
  setShapes: (updater: (prev: Shape[]) => Shape[]) => void;
  setSelectedIds: (ids: string[]) => void;
  /** call this to push an undo snapshot, if you have one */
  commit?: () => void;
};

export function useClipboard({
  shapes,
  selectedIds,
  setShapes,
  setSelectedIds,
  commit,
}: Args) {
  const clipboard = useRef<Shape[]>([]);
  const pasteCount = useRef(0);

  useEffect(() => {
    const clone = (items: Shape[], n: number): Shape[] =>
      items.map((s) => ({
        ...structuredClone(s),
        id: newId(),
        x: s.x + OFFSET * n,
        y: s.y + OFFSET * n,
      }));

    const insert = (copies: Shape[]) => {
      commit?.();
      setShapes((prev) => [...prev, ...copies]);
      setSelectedIds(copies.map((c) => c.id));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // leave normal copy/paste alone inside the doc editor, label input, AI prompt bar
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable='true'], .ProseMirror"))
        return;

      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      const selected = shapes.filter((s) => selectedIds.includes(s.id));

      if (key === "c" && selected.length) {
        e.preventDefault();
        clipboard.current = structuredClone(selected);
        pasteCount.current = 0;
      } else if (key === "v" && clipboard.current.length) {
        e.preventDefault();
        pasteCount.current += 1;
        insert(clone(clipboard.current, pasteCount.current));
      } else if (key === "d") {
        e.preventDefault(); // stops the browser's "bookmark this page"
        if (selected.length) insert(clone(selected, 1));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shapes, selectedIds, setShapes, setSelectedIds, commit]);
}
