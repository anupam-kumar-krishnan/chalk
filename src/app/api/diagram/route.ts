import { NextResponse } from "next/server";
import { extractDiagram, parseArrows } from "@/lib/parse";

const SYSTEM = `You turn a description into a diagram. Reply with ONLY JSON:
{"nodes":[{"id":"kebab-id","label":"Short label"}],"edges":[{"from":"id","to":"id"}]}
Use at most 12 nodes. Every edge must reference existing node ids.`;

export async function POST(req: Request) {
  const { prompt } = await req.json();
  if (typeof prompt !== "string" || !prompt.trim()) return NextResponse.json({ error: "Describe what to draw." }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // No key: fall back to parsing "A -> B" lines so the canvas still works.
    const d = parseArrows(prompt);
    return d.nodes.length ? NextResponse.json(d) : NextResponse.json({ error: "Set ANTHROPIC_API_KEY, or write lines like: A -> B -> C" }, { status: 422 });
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5", max_tokens: 1000, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) return NextResponse.json({ error: "The AI request failed. Try again." }, { status: 502 });
  const data = await res.json();
  const diagram = extractDiagram(data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "");
  return diagram ? NextResponse.json(diagram) : NextResponse.json({ error: "The AI reply wasn't a diagram. Try rephrasing." }, { status: 502 });
}
