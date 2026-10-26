import { emptyTable } from "./blocks";
export type Edit = { text: string; start: number; end: number };
type Fn = (t: string, s: number, e: number) => Edit;

const LIST = /^(- \[[ x]\] |- |\d+\. )/;

/** Wraps the selection (or a placeholder); wrapping again removes the markers. */
export function wrap(
  text: string,
  s: number,
  e: number,
  before: string,
  after = before,
  placeholder = "text",
): Edit {
  if (
    s !== e &&
    text.slice(s - before.length, s) === before &&
    text.slice(e, e + after.length) === after
  )
    return {
      text:
        text.slice(0, s - before.length) +
        text.slice(s, e) +
        text.slice(e + after.length),
      start: s - before.length,
      end: e - before.length,
    };
  const sel = text.slice(s, e) || placeholder;
  return {
    text: text.slice(0, s) + before + sel + after + text.slice(e),
    start: s + before.length,
    end: s + before.length + sel.length,
  };
}

/** Adds a prefix to every selected line; if all lines already have it, removes it. */
export function prefixLines(
  text: string,
  s: number,
  e: number,
  make: (i: number) => string,
  has: RegExp,
  strip: RegExp,
): Edit {
  const a = s > 0 ? text.lastIndexOf("\n", s - 1) + 1 : 0;
  let b = text.indexOf("\n", e);
  if (b < 0) b = text.length;
  const lines = text.slice(a, b).split("\n");
  const off = lines.every((l) => has.test(l));
  const block = lines
    .map((l, i) => (off ? "" : make(i)) + l.replace(strip, ""))
    .join("\n");
  return {
    text: text.slice(0, a) + block + text.slice(b),
    start: a,
    end: a + block.length,
  };
}

export function insert(
  text: string,
  s: number,
  e: number,
  str: string,
  cursor = str.length,
  inline = false,
): Edit {
  const lead = !inline && s > 0 && text[s - 1] !== "\n" ? "\n" : "";
  const pos = s + lead.length + cursor;
  return {
    text: text.slice(0, s) + lead + str + text.slice(e),
    start: pos,
    end: pos,
  };
}

export const heading =
  (n: number): Fn =>
  (t, s, e) =>
    prefixLines(
      t,
      s,
      e,
      () => "#".repeat(n) + " ",
      new RegExp(`^#{${n}} `),
      /^#{1,6} /,
    );
export const bullet: Fn = (t, s, e) =>
  prefixLines(t, s, e, () => "- ", /^- (?!\[[ x]\] )/, LIST);
export const numbered: Fn = (t, s, e) =>
  prefixLines(t, s, e, (i) => `${i + 1}. `, /^\d+\. /, LIST);
export const checklist: Fn = (t, s, e) =>
  prefixLines(t, s, e, () => "- [ ] ", /^- \[[ x]\] /, LIST);
export const quote: Fn = (t, s, e) =>
  prefixLines(t, s, e, () => "> ", /^> /, /^> /);

export const bold: Fn = (t, s, e) => wrap(t, s, e, "**");
export const italic: Fn = (t, s, e) => wrap(t, s, e, "*");
export const strike: Fn = (t, s, e) => wrap(t, s, e, "~~");
export const underline: Fn = (t, s, e) => wrap(t, s, e, "<u>", "</u>");
export const code: Fn = (t, s, e) => wrap(t, s, e, "`", "`", "code");

export const codeBlock: Fn = (t, s, e) => {
  const x = t.slice(s, e);
  return insert(t, s, e, "```\n" + x + "\n```\n", 4 + x.length);
};
export const table: Fn = (t, s, e) =>
  insert(t, s, e, "\n" + emptyTable().join("\n") + "\n");
export const divider: Fn = (t, s, e) => insert(t, s, e, "\n---\n\n");
export const image: Fn = (t, s, e) => insert(t, s, e, "![image](https://)", 17);
export const mention: Fn = (t, s, e) => insert(t, s, e, "@", 1, true);
export const link: Fn = (t, s, e) => {
  const str = `[${t.slice(s, e) || "text"}](https://)`;
  return insert(t, s, e, str, str.length - 1, true);
};
