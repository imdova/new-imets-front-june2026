"use client";

import * as React from "react";
import { Check, ChevronDown, Copy, MessageCircle, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  Objection,
  SalesOrientation,
} from "@/features/orientation/lib/sales-orientation";

/**
 * The objection bank — fourteen real objections to IMETS programmes, each with
 * what sits behind it, the weak reply, the model reply, and the policy facts a
 * rep can state without checking with anyone.
 *
 * Built to be used mid-conversation, not just read once: filter by category,
 * search the text, and copy the model reply or the closing question straight
 * into WhatsApp. Several of these answers are the difference between a sale and
 * a refund request later — the accreditation and attendance ones in particular
 * are where an off-the-cuff reply creates a promise the school cannot keep.
 */

/** Copy-to-clipboard for a reply the rep will paste into a chat. */
function CopyLine({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked (insecure context or denied) — the text is on
          // screen and selectable, so nothing is lost.
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "اتنسخ" : label}
    </button>
  );
}

export function ObjectionsModule({
  method,
  objections,
  onComplete,
}: {
  method: SalesOrientation["objectionMethod"];
  objections: Objection[];
  onComplete: () => void;
}) {
  const categories = React.useMemo(
    () => [...new Set(objections.map((o) => o.category))],
    [objections],
  );

  const [filter, setFilter] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<number | null>(null);
  const [opened, setOpened] = React.useState<Set<number>>(new Set());

  /*
   * The lesson completes on having opened at least one objection from every
   * category. Price, trust, time, hesitation and eligibility each need a
   * different kind of answer, and reading three price objections teaches none
   * of that. Requiring all fourteen would only train people to click.
   */
  const covered = React.useMemo(
    () => new Set([...opened].map((i) => objections[i].category)),
    [opened, objections],
  );

  React.useEffect(() => {
    if (covered.size >= categories.length) onComplete();
  }, [covered, categories.length, onComplete]);

  const visible = objections
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => (filter ? o.category === filter : true))
    .filter(({ o }) => {
      const q = query.trim();
      if (!q) return true;
      return o.objection.includes(q) || o.behind.includes(q) || o.right.includes(q);
    });

  return (
    <div className="space-y-6">
      {/* The method comes first — the bank is unusable without the order. */}
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
        <p className="text-sm leading-relaxed">{method.intro}</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {method.steps.map((s) => (
            <li key={s.title} className="rounded-xl bg-card p-3 ring-1 ring-border/60">
              <span className="text-[11px] font-bold text-primary">{s.n}</span>
              <span className="mt-0.5 block text-sm font-bold">{s.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {s.body}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed ring-1 ring-amber-500/25">
          {method.isolate}
        </p>
      </div>

      {/* Category chips double as the coverage indicator. */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 hover:border-primary/40",
            )}
          >
            الكل ({objections.length})
          </button>
          {categories.map((c) => {
            const isCovered = covered.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(filter === c ? null : c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCovered
                      ? "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-700"
                      : "border-border/70 hover:border-primary/40",
                )}
              >
                {isCovered && <Check className="size-3" />}
                {c}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر على اعتراض…"
            aria-label="بحث في بنك الاعتراضات"
            className="h-10 w-full rounded-xl border border-border/70 bg-card pe-10 ps-3 text-sm outline-none transition-colors focus:border-primary/50"
          />
        </div>

        {covered.size < categories.length && (
          <p className="text-xs text-muted-foreground">
            افتح اعتراضًا واحدًا على الأقل من كل تصنيف عشان تكمّل الدرس ({covered.size} من{" "}
            {categories.length})
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
          ما فيش اعتراض مطابق للبحث.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map(({ o, i }) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-card transition-colors",
                  isOpen ? "border-primary/40" : "border-border/70",
                )}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : i);
                    setOpened((p) => new Set(p).add(i));
                  }}
                  className="flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                      opened.has(i)
                        ? "bg-emerald-500 text-white"
                        : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {opened.has(i) ? (
                      <Check className="size-3.5" />
                    ) : (
                      <MessageCircle className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">«{o.objection}»</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {o.category}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-border/60 p-4">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        اللي وراه
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">{o.behind}</p>
                    </div>

                    <div className="rounded-xl bg-destructive/[0.06] p-3 ring-1 ring-destructive/20">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-destructive">
                        <X className="size-3.5" />
                        الرد الضعيف
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">«{o.wrong}»</p>
                    </div>

                    <div className="rounded-xl bg-emerald-500/[0.07] p-3 ring-1 ring-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          <Check className="size-3.5" />
                          الرد النموذجي
                        </p>
                        <span className="ms-auto">
                          <CopyLine text={o.right} label="نسخ الرد" />
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{o.right}</p>
                    </div>

                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                        حقائق تقدر تقولها من غير خوف
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {o.facts.map((f, fi) => (
                          <li key={fi} className="flex gap-2 text-sm leading-relaxed">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/50" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-primary/[0.06] p-3 ring-1 ring-primary/20">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                          الخطوة التالية
                        </p>
                        <span className="ms-auto">
                          <CopyLine text={o.next} label="نسخ" />
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{o.next}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
