"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { clearCanvas, setDiagram, setStatus } from "@/store/canvasSlice";
import { autoLayout } from "@/lib/layout";

export default function AiBar() {
  const dispatch = useDispatch();
  const doc = useSelector((s: RootState) => s.doc.text);
  const { status, error } = useSelector((s: RootState) => s.canvas);
  const [prompt, setPrompt] = useState("");

  async function generate(text: string) {
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
    } catch (e) {
      dispatch(setStatus({ status: "error", error: (e as Error).message }));
    }
  }

  return (
    <div className="border-t border-line p-3">
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && prompt && generate(prompt)}
          placeholder="e.g. OAuth login flow with a mobile app and an auth server"
          aria-label="Diagram prompt"
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-sm"
        />
        <button
          disabled={!prompt || status === "loading"}
          onClick={() => generate(prompt)}
          className="rounded-lg bg-pop px-4 py-2 text-sm font-medium text-ink disabled:opacity-40"
        >
          {status === "loading" ? "Drawing…" : "Generate diagram"}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-mute">
        <button className="underline" onClick={() => generate(doc)}>
          Draw from my doc
        </button>
        <button className="underline" onClick={() => dispatch(clearCanvas())}>
          Clear canvas
        </button>
        {status === "error" && (
          <span role="alert" className="text-pop">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
