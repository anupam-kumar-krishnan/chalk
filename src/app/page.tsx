// app/page.tsx — Chalk landing page (Next.js App Router, TypeScript, Tailwind)
// Colors are Tailwind arbitrary values, so no tailwind.config changes are needed.
//   board #16181d · panel #1e2026 · line #2c2f38 · chalk #ece9e1 · muted #9a9ca6 · pink #ff4d6d · blue #8fd0ff
import type { ReactNode } from "react";
import Link from "next/link";
import { Space_Grotesk, Source_Serif_4 } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const doc = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"] });

const WORKSPACE = "/workspace";
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fd0ff]";
const btnPrimary = `inline-flex items-center rounded-lg bg-[#ff4d6d] px-5 py-3 font-medium text-[#16181d] transition hover:bg-[#ff6b85] ${focus}`;
const btnGhost = `inline-flex items-center rounded-lg border border-[#2c2f38] px-5 py-3 text-[#ece9e1] transition hover:border-[#9a9ca6] ${focus}`;

const steps = [
  {
    title: "Prompt",
    text: "Describe a system in plain words, or write one chain per line in your doc: Customer -> Web app -> Orders API.",
  },
  {
    title: "AI draft",
    text: "Chalk turns it into boxes and arrows. Repeat a name and it stays one box with more arrows.",
  },
  {
    title: "Your edits",
    text: "Drag, rename, add icons, redraw an arrow. Undo and redo cover every change.",
  },
  {
    title: "Shared doc",
    text: "The diagram lives inside the doc that explains it, so the two never drift apart.",
  },
];

const prompts = [
  "OAuth login flow with a mobile app and an auth server",
  "Checkout service with payments, inventory and email receipts",
  "URL shortener with a cache and a database",
  "Notification system with a queue and workers",
];

const tools = [
  "Select",
  "Rectangle",
  "Ellipse",
  "Arrow",
  "Line",
  "Pen",
  "Text",
  "Icons",
];

const plans = [
  // Placeholder tiers. Only publish this section once billing actually works.
  {
    name: "Free",
    price: "₹0",
    note: "For trying Chalk out",
    items: [
      "Docs and diagrams",
      "Chain syntax, unlimited",
      "A few AI drafts a day",
    ],
    cta: "Start a doc",
    primary: false,
  },
  {
    name: "Pro",
    price: "₹499",
    note: "per month, placeholder",
    items: [
      "Everything in Free",
      "Many more AI drafts",
      "Priority for new features",
    ],
    cta: "Join the waitlist",
    primary: true,
  },
];

const faqs = [
  {
    q: "Do I need AI to make a diagram?",
    a: "No. Write a chain like Orders API -> Inventory, select it and press the sparkle button. The AI prompt box is for when you would rather describe the system in words.",
  },
  {
    q: "Can I change what the AI draws?",
    a: "Yes. The result is a normal canvas. Drag any box, and the arrows follow.",
  },
  {
    q: "What can I draw by hand?",
    a: "Rectangles, ellipses, arrows, lines, freehand, text and a set of system icons such as servers, clouds, locks and cards.",
  },
];

function HeroDemo() {
  const edge = (d: string, i: number) => (
    <path
      key={d}
      d={d}
      pathLength={1}
      className="chalk-edge"
      style={{ animationDelay: `${0.5 + i * 0.25}s` }}
      fill="none"
      stroke="#9a9ca6"
      strokeWidth={1.5}
      markerEnd="url(#head)"
    />
  );
  const node = (x: number, y: number, label: string, i: number) => (
    <g
      key={label}
      className="chalk-node"
      style={{ animationDelay: `${i * 0.25}s` }}
    >
      <rect
        x={x}
        y={y}
        width={100}
        height={36}
        rx={8}
        fill="#1e2026"
        stroke="#2c2f38"
      />
      <text
        x={x + 50}
        y={y + 22}
        textAnchor="middle"
        fontSize={12}
        fill="#ece9e1"
      >
        {label}
      </text>
    </g>
  );
  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#2c2f38] bg-[#1e2026] md:grid-cols-[1fr_1.15fr]">
      <style>{`
        .chalk-edge{stroke-dasharray:1;stroke-dashoffset:1;animation:draw .5s ease-out forwards}
        .chalk-node{opacity:0;animation:show .35s ease-out forwards}
        @keyframes draw{to{stroke-dashoffset:0}} @keyframes show{to{opacity:1}}
        @media (prefers-reduced-motion:reduce){.chalk-edge{stroke-dashoffset:0;animation:none}.chalk-node{opacity:1;animation:none}}
      `}</style>
      <div
        className={`${doc.className} border-b border-[#2c2f38] p-6 md:border-b-0 md:border-r`}
      >
        <h3 className="text-2xl font-semibold text-[#ece9e1]">Checkout flow</h3>
        <p className="mt-3 text-[#9a9ca6]">
          Write one chain per line, select it, then press the sparkle button.
        </p>
        <p className="mt-4 rounded bg-[#ff4d6d]/15 px-2 py-1 text-[#ece9e1]">
          Customer -&gt; Web app -&gt; Orders API -&gt; Payments
        </p>
        <p className="mt-2 rounded bg-[#ff4d6d]/15 px-2 py-1 text-[#ece9e1]">
          Orders API -&gt; Inventory
        </p>
        <p className="mt-2 rounded bg-[#ff4d6d]/15 px-2 py-1 text-[#ece9e1]">
          Payments -&gt; Email receipt
        </p>
      </div>
      <svg
        viewBox="0 0 520 210"
        role="img"
        aria-label="Diagram generated from the checkout flow chains"
        className="w-full bg-[radial-gradient(#2c2f38_1px,transparent_1px)] [background-size:18px_18px] p-2"
      >
        <defs>
          <marker
            id="head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0 10 5 0 10z" fill="#9a9ca6" />
          </marker>
        </defs>
        {[
          node(10, 50, "Customer", 0),
          node(140, 50, "Web app", 1),
          node(270, 50, "Orders API", 2),
          node(400, 50, "Payments", 3),
          node(270, 150, "Inventory", 4),
          node(400, 150, "Email receipt", 5),
        ]}
        {[
          edge("M110 68H140", 0),
          edge("M240 68H270", 1),
          edge("M370 68H400", 2),
          edge("M320 86V150", 3),
          edge("M450 86V150", 4),
        ]}
      </svg>
    </div>
  );
}

// ---- Bento card animations -------------------------------------------------
// Base styles are the finished, static state, so reduced-motion users see a complete picture.
const bentoCss = `
.b-pill{animation:b-pill 9s ease-in-out infinite}
.b-tab{animation:b-tab 9s linear infinite}
@keyframes b-pill{0%,30%{transform:translateX(0)}33.3%,63.3%{transform:translateX(6rem)}66.6%,96.6%{transform:translateX(12rem)}100%{transform:translateX(0)}}
@keyframes b-tab{0%,30%{color:#16181d}33.3%,100%{color:#9a9ca6}}

.b-edge{stroke-dasharray:1;animation:b-edge 4s ease-in-out infinite backwards}
@keyframes b-edge{0%{stroke-dashoffset:1}30%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:1}}

.b-type{animation:b-type 6s steps(16,end) infinite}
.b-caret{animation:b-blink 1s steps(1) infinite}
.b-chip{animation:b-chip 6s ease-out infinite backwards}
@keyframes b-type{0%{width:0}40%,90%{width:16ch}100%{width:0}}
@keyframes b-blink{50%{opacity:0}}
@keyframes b-chip{0%,40%{opacity:0;transform:translateY(4px)}50%,90%{opacity:1;transform:none}100%{opacity:0}}

.b-bob{animation:b-bob 2.4s ease-in-out infinite}
@keyframes b-bob{0%,60%,100%{transform:none}30%{transform:translateY(-5px)}}

.b-static{display:none}
@media (prefers-reduced-motion:reduce){
  .b-pill,.b-tab,.b-edge,.b-type,.b-caret,.b-chip,.b-bob{animation:none}
  .b-live{display:none}.b-static{display:block}
}`;

function TabsLoop() {
  return (
    <div
      className="relative mt-6 inline-flex rounded-lg border border-[#2c2f38] p-1 text-sm"
      aria-hidden
    >
      <span className="b-pill absolute left-1 top-1 h-[calc(100%-0.5rem)] w-24 translate-x-24 rounded-md bg-[#ece9e1]" />
      {["Doc", "Both", "Diagram"].map((v, i) => (
        <span
          key={v}
          className={`b-tab relative w-24 py-1.5 text-center ${v === "Both" ? "text-[#16181d]" : "text-[#9a9ca6]"}`}
          style={{ animationDelay: `${-((3 - i) % 3) * 3}s` }}
        >
          {v}
        </span>
      ))}
    </div>
  );
}

function GraphLoop() {
  const box = (x: number, y: number, label: string) => (
    <g key={label}>
      <rect
        x={x}
        y={y}
        width={80}
        height={26}
        rx={7}
        fill="#16181d"
        stroke="#2c2f38"
      />
      <text
        x={x + 40}
        y={y + 17}
        textAnchor="middle"
        fontSize={11}
        fill="#ece9e1"
      >
        {label}
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 220 90"
      className="mt-4 w-full max-w-[220px]"
      role="img"
      aria-label="One Orders API box with arrows to Payments and Inventory"
    >
      <defs>
        <marker
          id="bhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="#9a9ca6" />
        </marker>
      </defs>
      {box(6, 32, "Orders API")}
      {box(134, 6, "Payments")}
      {box(134, 58, "Inventory")}
      <path
        className="b-edge"
        pathLength={1}
        d="M86 45C110 45 110 19 134 19"
        fill="none"
        stroke="#9a9ca6"
        strokeWidth={1.5}
        markerEnd="url(#bhead)"
      />
      <path
        className="b-edge"
        pathLength={1}
        style={{ animationDelay: "0.3s" }}
        d="M86 45C110 45 110 71 134 71"
        fill="none"
        stroke="#9a9ca6"
        strokeWidth={1.5}
        markerEnd="url(#bhead)"
      />
    </svg>
  );
}

function PromptLoop() {
  return (
    <>
      <div className="mt-4 rounded bg-[#16181d] p-3 font-mono text-sm text-[#ece9e1]">
        <span className="b-type inline-block max-w-full overflow-hidden whitespace-nowrap align-bottom">
          OAuth login flow
        </span>
        <span className="b-caret text-[#ff4d6d]" aria-hidden>
          |
        </span>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-2 text-xs text-[#9a9ca6]"
        aria-hidden
      >
        {["App", "Auth server", "Token"].map((c, i) => (
          <span
            key={c}
            className="b-chip rounded-md border border-[#2c2f38] px-2 py-1"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {c}
          </span>
        ))}
      </div>
    </>
  );
}

function DragLoop() {
  const stroke = {
    fill: "none",
    stroke: "#9a9ca6",
    strokeWidth: 1.5,
    markerEnd: "url(#dhead)",
  } as const;
  const rect = {
    width: 60,
    height: 28,
    rx: 7,
    fill: "#16181d",
    stroke: "#2c2f38",
  } as const;
  const ease = {
    calcMode: "spline",
    keyTimes: "0;.5;1",
    keySplines: ".45 0 .55 1;.45 0 .55 1",
    dur: "4s",
    repeatCount: "indefinite",
  } as const;
  return (
    <svg
      viewBox="0 0 220 100"
      className="mt-4 w-full max-w-[220px]"
      role="img"
      aria-label="A box being dragged while its arrow follows"
    >
      <defs>
        <marker
          id="dhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0 0 10 5 0 10z" fill="#9a9ca6" />
        </marker>
      </defs>
      <rect x={10} y={32} {...rect} />
      <text x={40} y={50} textAnchor="middle" fontSize={11} fill="#ece9e1">
        API
      </text>
      <g className="b-live">
        <line x1={70} y1={46} x2={150} y2={22} {...stroke}>
          <animate attributeName="y2" values="22;78;22" {...ease} />
        </line>
        <rect x={150} y={8} {...rect}>
          <animate attributeName="y" values="8;64;8" {...ease} />
        </rect>
        <text x={180} y={26} textAnchor="middle" fontSize={11} fill="#ece9e1">
          <animate attributeName="y" values="26;82;26" {...ease} />
          Database
        </text>
      </g>
      <g className="b-static">
        <line x1={70} y1={46} x2={150} y2={22} {...stroke} />
        <rect x={150} y={8} {...rect} />
        <text x={180} y={26} textAnchor="middle" fontSize={11} fill="#ece9e1">
          Database
        </text>
      </g>
    </svg>
  );
}

const iconPaths: Record<string, ReactNode> = {
  Server: (
    <>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </>
  ),
  Cloud: (
    <path d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 9.5 4.25 4.25 0 0 0 7 18z" />
  ),
  Lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  Mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  Card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  User: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function IconWave() {
  return (
    <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
      {Object.entries(iconPaths).map(([name, path], i) => (
        <span
          key={name}
          className="b-bob grid h-11 w-11 place-items-center rounded-lg border border-[#2c2f38] bg-[#16181d] text-[#8fd0ff]"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {path}
          </svg>
        </span>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <div
      className={`${display.className} min-h-screen bg-[#16181d] text-[#ece9e1] antialiased`}
    >
      <header className="sticky top-0 z-10 border-b border-[#2c2f38] bg-[#16181d]/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className={`flex items-center gap-2 text-lg font-bold ${focus}`}
          >
            Chalk
          </Link>
          <ul className="hidden gap-8 text-sm text-[#9a9ca6] md:flex">
            {[
              ["How it works", "#how"],
              ["Features", "#features"],
              ["Examples", "#examples"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([l, h]) => (
              <li key={h}>
                <a href={h} className={`hover:text-[#ece9e1] ${focus}`}>
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href={WORKSPACE}
            className="rounded-lg border border-[#2c2f38] px-4 py-2 text-sm hover:border-[#9a9ca6]"
          >
            Open workspace
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Explain it in words. Draw it in seconds.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#9a9ca6]">
            A docs and diagramming workspace where AI sketches the first draft
            of your architecture, and you take it from there.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={WORKSPACE} className={btnPrimary}>
              Start a doc
            </Link>
            <a href="#how" className={btnGhost}>
              See how it works
            </a>
          </div>
          <div className="mt-14">
            <HeroDemo />
          </div>
        </section>

        <section id="how" className="border-t border-[#2c2f38] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
              From a sentence to a shared diagram
            </h2>
            <ol className="mt-12 grid gap-8 md:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="border-t-2 border-[#ff4d6d] pt-4">
                  <p className="text-sm text-[#9a9ca6]">Step {i + 1}</p>
                  <h3 className="mt-1 text-xl font-medium">{s.title}</h3>
                  <p className="mt-2 text-[#9a9ca6]">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="border-t border-[#2c2f38] py-20">
          <style>{bentoCss}</style>
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
              Built for writing about systems
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-6">
              <article className="rounded-2xl border border-[#2c2f38] bg-[#1e2026] p-6 md:col-span-4">
                <h3 className="text-xl font-medium">Docs that hold diagrams</h3>
                <p className="mt-2 max-w-md text-[#9a9ca6]">
                  Write the explanation and draw the system in the same
                  workspace. Switch between three views as you work.
                </p>
                <TabsLoop />
              </article>
              <article className="rounded-2xl border border-[#2c2f38] bg-[#1e2026] p-6 md:col-span-2">
                <h3 className="text-xl font-medium">Chains become graphs</h3>
                <p className="mt-2 text-[#9a9ca6]">
                  Repeat a name and it stays one box with more arrows.
                </p>
                <code className="mt-4 block rounded bg-[#16181d] p-3 text-sm text-[#8fd0ff]">
                  Orders API -&gt; Inventory
                </code>
                <GraphLoop />
              </article>
              <article className="rounded-2xl border border-[#2c2f38] bg-[#1e2026] p-6 md:col-span-2">
                <h3 className="text-xl font-medium">
                  A first draft in seconds
                </h3>
                <p className="mt-2 text-[#9a9ca6]">
                  Describe a flow in plain words, or point the AI at your doc.
                </p>
                <PromptLoop />
              </article>
              <article className="rounded-2xl border border-[#2c2f38] bg-[#1e2026] p-6 md:col-span-2">
                <h3 className="text-xl font-medium">A canvas you can move</h3>
                <p className="mt-2 text-[#9a9ca6]">
                  Drag any box. Arrows follow. Zoom, fit, undo and redo.
                </p>
                <DragLoop />
              </article>
              <article className="rounded-2xl border border-[#2c2f38] bg-[#1e2026] p-6 md:col-span-2">
                <h3 className="text-xl font-medium">Icons for real systems</h3>
                <p className="mt-2 text-[#9a9ca6]">
                  Servers, clouds, locks, mail, cards and more, ready to drop
                  in.
                </p>
                <IconWave />
              </article>
            </div>
            <ul
              className="mt-8 flex flex-wrap gap-2 text-sm text-[#9a9ca6]"
              aria-label="Drawing tools"
            >
              {tools.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-[#2c2f38] px-3 py-1"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="examples" className="border-t border-[#2c2f38] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
              Start from a prompt
            </h2>
            <p className="mt-3 max-w-lg text-[#9a9ca6]">
              Pick one, open the workspace and press Generate diagram.
            </p>
            <ul className="mt-8 grid gap-3 md:grid-cols-2">
              {prompts.map((p) => (
                <li key={p}>
                  <Link
                    href={`${WORKSPACE}?prompt=${encodeURIComponent(p)}`}
                    className={`block rounded-xl border border-[#2c2f38] bg-[#1e2026] p-5 transition hover:border-[#ff4d6d] ${focus}`}
                  >
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pricing" className="border-t border-[#2c2f38] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
              Free to start
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {plans.map((p) => (
                <article
                  key={p.name}
                  className={`rounded-2xl border p-8 ${p.primary ? "border-[#ff4d6d] bg-[#1e2026]" : "border-[#2c2f38]"}`}
                >
                  <h3 className="text-xl font-medium">{p.name}</h3>
                  <p className="mt-3 text-4xl font-bold">{p.price}</p>
                  <p className="text-sm text-[#9a9ca6]">{p.note}</p>
                  <ul className="mt-6 space-y-2 text-[#9a9ca6]">
                    {p.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                  <Link
                    href={WORKSPACE}
                    className={`mt-8 ${p.primary ? btnPrimary : btnGhost}`}
                  >
                    {p.cta}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-[#2c2f38] py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold md:text-4xl">Questions</h2>
            <div className="mt-8 divide-y divide-[#2c2f38] border-y border-[#2c2f38]">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between text-lg ${focus}`}
                  >
                    {f.q}
                    <span
                      className="text-[#9a9ca6] transition group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl text-[#9a9ca6]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#2c2f38] py-24 text-center">
          <h2 className="mx-auto max-w-2xl text-4xl font-bold md:text-5xl">
            Your next design doc, drawn as you write it.
          </h2>
          <Link href={WORKSPACE} className={`mt-8 ${btnPrimary}`}>
            Start a doc
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#2c2f38] py-8 text-sm text-[#9a9ca6]">
        <div className="mx-auto flex max-w-6xl justify-between px-6">
          <span>Chalk</span>
          <span>Built by Anupam Kumar Krishnan</span>
        </div>
      </footer>
    </div>
  );
}
