"use client";
import { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setTool } from "@/store/canvasSlice";
import { Tool } from "@/lib/types";

const I = (d: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {d}
  </svg>
);
export const TOOLS: {
  id: Tool;
  label: string;
  key: string;
  icon: ReactNode;
}[] = [
  {
    id: "select",
    label: "Select",
    key: "v",
    icon: I(<path d="M5 3l14 7-6 2-2 6z" />),
  },
  {
    id: "rect",
    label: "Rectangle",
    key: "r",
    icon: I(<rect x="4" y="4" width="16" height="16" rx="1" />),
  },
  {
    id: "ellipse",
    label: "Ellipse",
    key: "o",
    icon: I(<circle cx="12" cy="12" r="8" />),
  },
  {
    id: "arrow",
    label: "Arrow",
    key: "a",
    icon: I(<path d="M6 18L18 6M9 6h9v9" />),
  },
  { id: "line", label: "Line", key: "l", icon: I(<path d="M6 18L18 6" />) },
  {
    id: "draw",
    label: "Draw",
    key: "d",
    icon: I(<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" />),
  },
  {
    id: "text",
    label: "Text",
    key: "t",
    icon: I(<path d="M3 7h8M7 7v11M13 10h8M17 10v8" />),
  },
  {
    id: "icon",
    label: "Insert icon",
    key: "i",
    icon: I(
      <>
        <path d="M10 3l1.5 3.5L15 8l-3.5 1.5L10 13 8.5 9.5 5 8l3.5-1.5z" />
        <circle cx="16" cy="16" r="3.5" />
        <path d="M19 19l2 2" />
      </>,
    ),
  },
];

export default function Toolbar() {
  const tool = useSelector((s: RootState) => s.canvas.tool);
  const dispatch = useDispatch();
  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Canvas tools"
      className="absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-xl border border-line bg-panel p-1.5"
    >
      {TOOLS.map((t) => (
        <button
          key={t.id}
          aria-pressed={tool === t.id}
          aria-label={`${t.label} (${t.key.toUpperCase()})`}
          title={`${t.label} (${t.key.toUpperCase()})`}
          onClick={() => dispatch(setTool(t.id))}
          className={`relative grid h-10 w-10 place-items-center rounded-lg ${tool === t.id ? "bg-line text-paper" : "text-mute hover:bg-line/60 hover:text-paper"}`}
        >
          {t.icon}
          <span className="absolute right-1 bottom-0.5 text-[9px] text-mute">
            {t.key.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );
}
