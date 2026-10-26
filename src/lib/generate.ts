import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";
import { setDiagram, setStatus } from "@/store/canvasSlice";
import { autoLayout } from "./layout";

/** Asks the AI for a diagram and puts it on the canvas. Returns true on success. */
export async function generateDiagram(
  dispatch: Dispatch<UnknownAction>,
  text: string,
) {
  dispatch(setStatus({ status: "loading" }));
  try {
    const res = await fetch("/api/diagram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    dispatch(setDiagram({ nodes: autoLayout(data), edges: data.edges }));
    return true;
  } catch (e) {
    dispatch(setStatus({ status: "error", error: (e as Error).message }));
    return false;
  }
}
