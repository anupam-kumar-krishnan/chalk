"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { RootState } from "@/store";
import { setDoc, setTitle } from "@/store/docSlice";
import { setMode } from "@/store/uiSlice";
import { generateDiagram } from "@/lib/generate";

const Ic = ({ children }: { children: ReactNode }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);
const Caret = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="M7 10l5 5 5-5" />
  </svg>
);
const Sep = () => <span className="mx-1 h-5 w-px bg-line" aria-hidden />;
const btn =
  "flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-lg px-2 text-mute hover:bg-line hover:text-paper disabled:opacity-40";
const ctl =
  "rounded-md px-2 py-1 text-xs text-mute hover:bg-line hover:text-paper disabled:opacity-40";

type Menu = "plus" | "text" | null;

export default function DocEditor() {
  const { title, content } = useSelector((s: RootState) => s.doc);
  const mode = useSelector((s: RootState) => s.ui.mode);
  const { status, error } = useSelector((s: RootState) => s.canvas);
  const dispatch = useDispatch();
  const bar = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<Menu>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      ImageExt,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "doc", "aria-label": "Doc body" } },
    onUpdate: ({ editor }) =>
      dispatch(
        setDoc({
          html: editor.getHTML(),
          text: editor.getText({ blockSeparator: "\n" }),
        }),
      ),
  });

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) =>
      !bar.current?.contains(e.target as Node) && setMenu(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  if (!editor) return <div className="h-full" />;

  const c = () => editor.chain().focus();
  const done = (fn: () => void) => () => {
    fn();
    setMenu(null);
  };
  const insertTable = () =>
    c().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run();
  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    if (editor.state.selection.empty)
      c()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url } }],
        })
        .run();
    else c().setLink({ href: url }).run();
  };
  const addImage = () => {
    const src = window.prompt("Image URL", "https://");
    if (src) c().setImage({ src }).run();
  };

  const ai = async () => {
    const { from, to } = editor.state.selection;
    const sel = editor.state.doc.textBetween(from, to, "\n").trim();
    setMenu(null);
    if (
      (await generateDiagram(
        dispatch,
        sel || editor.getText({ blockSeparator: "\n" }),
      )) &&
      mode === "doc"
    )
      dispatch(setMode("both"));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.altKey && e.code === "KeyT") {
      e.preventDefault();
      insertTable();
    } else if (!e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      addLink();
    }
  };

  const tool = (
    label: string,
    icon: ReactNode,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={label}
      className={`${btn} ${active ? "bg-line text-paper" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
    </button>
  );
  const item = (
    label: string,
    hint: string,
    icon: ReactNode,
    onClick: () => void,
  ) => (
    <button
      key={label}
      role="menuitem"
      onClick={done(onClick)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-line"
    >
      <span className="text-mute">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-xs text-mute">{hint}</span>
    </button>
  );
  const fmt = (
    label: string,
    face: ReactNode,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      key={label}
      role="menuitem"
      aria-label={label}
      onClick={done(onClick)}
      className={`h-10 w-10 rounded-lg font-bold hover:bg-line ${active ? "bg-line" : ""}`}
    >
      {face}
    </button>
  );
  const focusEnd = () => {
    const last = editor.state.doc.lastChild;
    if (last?.type.name !== "paragraph")
      c()
        .insertContentAt(editor.state.doc.content.size, { type: "paragraph" })
        .focus("end")
        .run();
    else c().focus("end").run();
  };

  return (
    <div className="relative flex h-full flex-col" onKeyDown={onKeyDown}>
      <input
        value={title}
        onChange={(e) => dispatch(setTitle(e.target.value))}
        aria-label="Doc title"
        className="bg-transparent px-6 pt-6 text-2xl font-bold outline-none"
      />

      {editor.isActive("table") && (
        <div
          role="toolbar"
          aria-label="Table"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-4 right-4 z-10 flex gap-0.5 rounded-lg border border-line bg-panel p-0.5"
        >
          <button className={ctl} onClick={() => c().addRowAfter().run()}>
            + Row
          </button>
          <button className={ctl} onClick={() => c().deleteRow().run()}>
            − Row
          </button>
          <button className={ctl} onClick={() => c().addColumnAfter().run()}>
            + Column
          </button>
          <button className={ctl} onClick={() => c().deleteColumn().run()}>
            − Column
          </button>
          <button className={ctl} onClick={() => c().deleteTable().run()}>
            Delete table
          </button>
        </div>
      )}

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pt-4 pb-24">
        <EditorContent editor={editor} />
        <div className="min-h-24 cursor-text" onClick={focusEnd} />
      </div>

      {/* Keep the text selection when clicking toolbar buttons. */}
      <div
        ref={bar}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute bottom-4 left-4 z-10"
      >
        {status === "error" && (
          <p
            role="alert"
            className="absolute bottom-full mb-2 w-max max-w-xs rounded-lg border border-line bg-panel px-3 py-2 text-xs text-pop"
          >
            {error}
          </p>
        )}

        {menu === "plus" && (
          <div
            role="menu"
            aria-label="Insert"
            className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-line bg-panel p-2 text-sm"
          >
            {item(
              "Table",
              "Ctrl Alt T",
              <Ic>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18M3 15h18M10 4v16" />
              </Ic>,
              insertTable,
            )}
            {item(
              "Mention",
              "@",
              <Ic>
                <circle cx="12" cy="12" r="4" />
                <path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" />
              </Ic>,
              () => c().insertContent("@").run(),
            )}
            {item(
              "Link",
              "Ctrl K",
              <Ic>
                <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
              </Ic>,
              addLink,
            )}
            <div className="my-1 h-px bg-line" />
            {item(
              "Image",
              "",
              <Ic>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="M21 16l-5-5-8 8" />
              </Ic>,
              addImage,
            )}
            {item(
              "Divider line",
              "---",
              <Ic>
                <path d="M5 12h14" />
              </Ic>,
              () => c().setHorizontalRule().run(),
            )}
          </div>
        )}

        {menu === "text" && (
          <div
            role="menu"
            aria-label="Text style"
            className="absolute bottom-full left-12 mb-2 grid grid-cols-4 gap-1 rounded-xl border border-line bg-panel p-2"
          >
            {([1, 2, 3, 4] as const).map((n) =>
              fmt(
                `Heading ${n}`,
                <>
                  H<span className="text-[10px]">{n}</span>
                </>,
                editor.isActive("heading", { level: n }),
                () => c().toggleHeading({ level: n }).run(),
              ),
            )}
            {fmt("Bold", "B", editor.isActive("bold"), () =>
              c().toggleBold().run(),
            )}
            {fmt("Italic", <i>I</i>, editor.isActive("italic"), () =>
              c().toggleItalic().run(),
            )}
            {fmt("Strikethrough", <s>S</s>, editor.isActive("strike"), () =>
              c().toggleStrike().run(),
            )}
            {fmt("Underline", <u>U</u>, editor.isActive("underline"), () =>
              c().toggleUnderline().run(),
            )}
          </div>
        )}

        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex items-center rounded-xl border border-line bg-panel p-1.5"
        >
          <button
            className={`${btn} ${menu === "plus" ? "bg-line text-paper" : ""}`}
            aria-label="Insert"
            aria-haspopup="menu"
            aria-expanded={menu === "plus"}
            onClick={() => setMenu(menu === "plus" ? null : "plus")}
          >
            <Ic>
              <path d="M12 5v14M5 12h14" />
            </Ic>
            <Caret />
          </button>
          <Sep />
          <button
            className={`${btn} ${menu === "text" ? "bg-line text-paper" : ""}`}
            aria-label="Text style"
            aria-haspopup="menu"
            aria-expanded={menu === "text"}
            onClick={() => setMenu(menu === "text" ? null : "text")}
          >
            <span className="text-base font-bold text-paper">T</span>
            <Caret />
          </button>
          {tool(
            "Bulleted list",
            <Ic>
              <path d="M9 6h11M9 12h11M9 18h11" />
              <circle cx="4.5" cy="6" r="1" />
              <circle cx="4.5" cy="12" r="1" />
              <circle cx="4.5" cy="18" r="1" />
            </Ic>,
            editor.isActive("bulletList"),
            () => c().toggleBulletList().run(),
          )}
          {tool(
            "Numbered list",
            <Ic>
              <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v4M4 14h3l-3 3h3" />
            </Ic>,
            editor.isActive("orderedList"),
            () => c().toggleOrderedList().run(),
          )}
          {tool(
            "Checklist",
            <Ic>
              <rect x="3" y="4" width="5" height="5" rx="1" />
              <rect x="3" y="14" width="5" height="5" rx="1" />
              <path d="M12 6.5h9M12 16.5h9" />
            </Ic>,
            editor.isActive("taskList"),
            () => c().toggleTaskList().run(),
          )}
          <Sep />
          {tool(
            "Inline code",
            <Ic>
              <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
            </Ic>,
            editor.isActive("code"),
            () => c().toggleCode().run(),
          )}
          {tool(
            "Code block",
            <Ic>
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M10 10l-2 2 2 2M14 10l2 2-2 2" />
            </Ic>,
            editor.isActive("codeBlock"),
            () => c().toggleCodeBlock().run(),
          )}
          {tool(
            "Quote",
            <Ic>
              <path d="M4 5v14M9 7h11M9 12h8M9 17h11" />
            </Ic>,
            editor.isActive("blockquote"),
            () => c().toggleBlockquote().run(),
          )}
          <Sep />
          <button
            className={btn}
            aria-label="Generate diagram with AI"
            title="Generate diagram from selection or whole doc"
            disabled={status === "loading"}
            onClick={ai}
          >
            <span
              className={status === "loading" ? "animate-pulse text-pop" : ""}
            >
              <Ic>
                <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
              </Ic>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
