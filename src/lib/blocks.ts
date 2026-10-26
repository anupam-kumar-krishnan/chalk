export type Block = { kind: "text" | "table"; start: number; lines: string[] };

const isRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isSep = (l: string) => /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/.test(l);
const split = (l: string) =>
  l
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));

/** Splits the doc into text blocks and table blocks, by line. */
export function parseBlocks(content: string): Block[] {
  const all = content.split("\n"),
    out: Block[] = [];
  let i = 0,
    text: string[] = [],
    textStart = 0;
  const flush = () => {
    if (text.length) out.push({ kind: "text", start: textStart, lines: text });
    text = [];
  };
  while (i < all.length) {
    if (isRow(all[i]) && i + 1 < all.length && isSep(all[i + 1])) {
      flush();
      let j = i + 2;
      while (j < all.length && isRow(all[j])) j++;
      out.push({ kind: "table", start: i, lines: all.slice(i, j) });
      i = j;
      textStart = j;
    } else {
      if (!text.length) textStart = i;
      text.push(all[i]);
      i++;
    }
  }
  flush();
  // Always leave somewhere to type above and below a table.
  if (out[0]?.kind === "table")
    out.unshift({ kind: "text", start: 0, lines: [] });
  if (out[out.length - 1]?.kind === "table")
    out.push({ kind: "text", start: all.length, lines: [] });
  return out;
}

export function tableRows(lines: string[]): string[][] {
  const rows = [lines[0], ...lines.slice(2)].map(split);
  const n = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array(n - r.length).fill("")]);
}

export function tableLines(rows: string[][]): string[] {
  const row = (r: string[]) =>
    "| " + r.map((c) => c.replace(/\|/g, "\\|")).join(" | ") + " |";
  return [
    row(rows[0]),
    "| " + rows[0].map(() => "---").join(" | ") + " |",
    ...rows.slice(1).map(row),
  ];
}

export const emptyTable = (rows = 3, cols = 3) =>
  tableLines(Array.from({ length: rows }, () => Array(cols).fill("")));

/** Returns the doc with one block's lines swapped for new ones. */
export function replaceLines(content: string, b: Block, next: string[]) {
  const all = content.split("\n");
  return [
    ...all.slice(0, b.start),
    ...next,
    ...all.slice(b.start + b.lines.length),
  ].join("\n");
}
