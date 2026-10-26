"use client";

const ctl =
  "rounded-md px-2 py-1 text-xs text-mute hover:bg-line hover:text-paper disabled:opacity-40";

export default function TableBlock({
  rows,
  onChange,
  onDelete,
}: {
  rows: string[][];
  onChange: (rows: string[][]) => void;
  onDelete: () => void;
}) {
  const cols = rows[0].length;
  const set = (r: number, c: number, v: string) =>
    onChange(
      rows.map((row, ri) =>
        ri === r ? row.map((x, ci) => (ci === c ? v : x)) : row,
      ),
    );
  return (
    <div className="group relative mx-6 my-4">
      <div className="absolute -top-9 right-0 z-10 flex gap-0.5 rounded-lg border border-line bg-panel p-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <button
          className={ctl}
          onClick={() => onChange([...rows, Array(cols).fill("")])}
        >
          + Row
        </button>
        <button
          className={ctl}
          disabled={rows.length < 2}
          onClick={() => onChange(rows.slice(0, -1))}
        >
          − Row
        </button>
        <button
          className={ctl}
          onClick={() => onChange(rows.map((r) => [...r, ""]))}
        >
          + Column
        </button>
        <button
          className={ctl}
          disabled={cols < 2}
          onClick={() => onChange(rows.map((r) => r.slice(0, -1)))}
        >
          − Column
        </button>
        <button className={ctl} onClick={onDelete}>
          Delete table
        </button>
      </div>
      <table className="w-full table-fixed border-collapse">
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-mute/60 p-0">
                  <input
                    value={cell}
                    onChange={(e) => set(r, c, e.target.value)}
                    aria-label={`Row ${r + 1}, column ${c + 1}`}
                    className="h-12 w-full bg-transparent px-3 text-sm outline-none"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
