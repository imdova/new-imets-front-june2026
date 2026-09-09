"use client";

import * as React from "react";
import { Check, ChevronDown, Copy, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  Rule,
  RuleLine,
  Scenario,
} from "@/features/orientation/lib/sales-orientation";

/**
 * The five interactive modules. Each reports completion upward the moment the
 * learner has actually done the thing — opened every rule, answered every
 * scenario, flipped every card — rather than on scroll, so the progress bar
 * tracks work rather than presence.
 */

/* ── shared bits ─────────────────────────────────────────────────────────── */

/** One line of scripted dialogue, styled by who is speaking. */
function DialogueLine({ line, tone }: { line: RuleLine; tone: "bad" | "good" }) {
  const isClient = line.side === "client";
  return (
    <div className={cn("flex", isClient ? "justify-start" : "justify-end")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isClient
            ? "bg-muted text-foreground/90"
            : tone === "bad"
              ? "bg-destructive/10 text-foreground ring-1 ring-destructive/25"
              : "bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/25",
        )}
      >
        {isClient && (
          <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
            العميل
          </span>
        )}
        {line.text}
      </p>
    </div>
  );
}

/* ── 1. the four rules ───────────────────────────────────────────────────── */

export function RulesModule({
  rules,
  onComplete,
}: {
  rules: Rule[];
  onComplete: () => void;
}) {
  const [open, setOpen] = React.useState<string | null>(rules[0]?.id ?? null);
  // The first rule starts open, so it counts as seen from the outset.
  const [seen, setSeen] = React.useState<Set<string>>(
    new Set(rules[0] ? [rules[0].id] : []),
  );

  React.useEffect(() => {
    if (seen.size >= rules.length) onComplete();
  }, [seen, rules.length, onComplete]);

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const isOpen = open === rule.id;
        return (
          <div
            key={rule.id}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors",
              isOpen ? "border-primary/40" : "border-border/70",
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => {
                setOpen(isOpen ? null : rule.id);
                setSeen((p) => new Set(p).add(rule.id));
              }}
              className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-muted/40"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold",
                  seen.has(rule.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                {seen.has(rule.id) ? <Check className="size-4" /> : rule.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{rule.title}</span>
                <span className="block text-xs text-muted-foreground">{rule.en}</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border/60 p-4 pt-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{rule.intro}</p>

                {rule.chips.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rule.chips.map((c) => (
                      <Badge key={c} variant="outline" className="font-normal">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {(["bad", "good"] as const).map((tone) => (
                    <div key={tone}>
                      <p
                        className={cn(
                          "mb-2 flex items-center gap-1.5 text-xs font-bold",
                          tone === "bad" ? "text-destructive" : "text-emerald-600",
                        )}
                      >
                        {tone === "bad" ? <X className="size-3.5" /> : <Check className="size-3.5" />}
                        {tone === "bad" ? "الغلط الشائع" : "الصح"}
                      </p>
                      <div className="space-y-1.5">
                        {rule[tone].map((line, i) => (
                          <DialogueLine key={i} line={line} tone={tone} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-primary/[0.06] p-3.5 ring-1 ring-primary/15">
                  <p className="text-center font-heading text-base font-bold tracking-tight text-primary">
                    {rule.formula}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.note}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── 2. practice ─────────────────────────────────────────────────────────── */

export function PracticeModule({
  scenarios,
  onComplete,
}: {
  scenarios: Scenario[];
  onComplete: () => void;
}) {
  const [picked, setPicked] = React.useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(
    ([qi, oi]) => scenarios[Number(qi)].options[oi].correct,
  ).length;

  React.useEffect(() => {
    if (answered >= scenarios.length) onComplete();
  }, [answered, scenarios.length, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
        <span className="text-sm font-medium">
          {answered} من {scenarios.length} مواقف
        </span>
        {answered > 0 && (
          <span className="text-sm text-muted-foreground">
            صح من أول مرة: <span className="font-bold text-emerald-600">{correct}</span>
          </span>
        )}
        {answered > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ms-auto gap-1.5"
            onClick={() => setPicked({})}
          >
            <RotateCcw className="size-3.5" />
            إعادة
          </Button>
        )}
      </div>

      {scenarios.map((q, qi) => {
        const choice = picked[qi];
        const done = choice !== undefined;
        return (
          <div key={qi} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                موقف {qi + 1} من {scenarios.length}
              </span>
              <Badge variant="secondary" className="ms-auto font-mono text-[11px]">
                {q.tag}
              </Badge>
            </div>

            <p className="mt-3 rounded-2xl bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
              <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
                العميل
              </span>
              {q.message}
            </p>

            <div className="mt-3 space-y-2">
              {q.options.map((o, oi) => {
                const isChoice = choice === oi;
                // After answering, the correct option is always revealed —
                // otherwise a wrong pick teaches only that it was wrong.
                const reveal = done && (isChoice || o.correct);
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={done}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl border p-3 text-start text-sm leading-relaxed transition-colors",
                      !done && "hover:border-primary/40 hover:bg-muted/40",
                      reveal && o.correct && "border-emerald-500/50 bg-emerald-500/[0.07]",
                      reveal && !o.correct && "border-destructive/50 bg-destructive/[0.06]",
                      !reveal && "border-border/70",
                      done && !reveal && "opacity-55",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                        reveal && o.correct && "bg-emerald-500 text-white",
                        reveal && !o.correct && "bg-destructive text-white",
                        !reveal && "bg-muted text-muted-foreground",
                      )}
                    >
                      {reveal ? (
                        o.correct ? <Check className="size-3" /> : <X className="size-3" />
                      ) : (
                        oi + 1
                      )}
                    </span>
                    <span>{o.text}</span>
                  </button>
                );
              })}
            </div>

            {done && (
              <p
                className={cn(
                  "mt-3 rounded-xl p-3 text-sm leading-relaxed",
                  q.options[choice].correct
                    ? "bg-emerald-500/[0.08] text-foreground ring-1 ring-emerald-500/20"
                    : "bg-destructive/[0.06] text-foreground ring-1 ring-destructive/20",
                )}
              >
                <b>{q.options[choice].correct ? "اختيار صحيح. " : "مش الأنسب. "}</b>
                {q.options[choice].feedback}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── 3. phrase bank ──────────────────────────────────────────────────────── */

export function PhraseBankModule({
  phrases,
  onComplete,
}: {
  phrases: { risky: string; safe: string }[];
  onComplete: () => void;
}) {
  const [flipped, setFlipped] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    if (flipped.size >= phrases.length) onComplete();
  }, [flipped, phrases.length, onComplete]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {phrases.map((p, i) => {
        const isSafe = flipped.has(i);
        return (
          <button
            key={i}
            type="button"
            aria-pressed={isSafe}
            onClick={() =>
              setFlipped((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })
            }
            className={cn(
              "group flex min-h-[8.5rem] flex-col rounded-2xl border p-4 text-start transition-all",
              isSafe
                ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                : "border-destructive/40 bg-destructive/[0.05]",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide",
                isSafe ? "text-emerald-600" : "text-destructive",
              )}
            >
              {isSafe ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {isSafe ? "الصياغة البديلة" : "جملة ممنوعة"}
            </span>
            <span className="mt-2 flex-1 text-sm font-medium leading-relaxed">
              «{isSafe ? p.safe : p.risky}»
            </span>
            <span className="mt-3 text-[11px] text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
              اضغط للتبديل بين الصيغتين
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── 4. next-step builder ────────────────────────────────────────────────── */

export function ClosingModule({
  closings,
  onComplete,
}: {
  closings: { situation: string; text: string }[];
  onComplete: () => void;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);

  const pick = (i: number) => {
    setActive(i);
    setCopied(false);
    onComplete();
  };

  const copy = async () => {
    if (active === null) return;
    try {
      await navigator.clipboard.writeText(closings[active].text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure context, permission denied) — the text is
      // on screen and selectable, so there is nothing to recover from.
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {closings.map((c, i) => (
          <button
            key={c.situation}
            type="button"
            aria-pressed={active === i}
            onClick={() => pick(i)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              active === i
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 hover:border-primary/40 hover:text-primary",
            )}
          >
            {c.situation}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          اقتراح الإقفال
        </p>
        {active === null ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            اختار حالة من فوق عشان تشوف الصيغة المناسبة ليها.
          </p>
        ) : (
          <>
            <p className="mt-2 rounded-2xl bg-emerald-500/[0.08] px-3.5 py-2.5 text-sm leading-relaxed ring-1 ring-emerald-500/20">
              {closings[active].text}
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={copy}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "اتنسخت" : "نسخ الصيغة"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 5. pre-send checklist ───────────────────────────────────────────────── */

export function ChecklistModule({
  items,
  onComplete,
}: {
  items: { question: string; hint: string }[];
  onComplete: () => void;
}) {
  const [ticked, setTicked] = React.useState<Set<number>>(new Set());
  const pct = Math.round((ticked.size / items.length) * 100);

  React.useEffect(() => {
    if (ticked.size >= items.length) onComplete();
  }, [ticked, items.length, onComplete]);

  return (
    <div className="space-y-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {items.map((item, i) => {
        const on = ticked.has(i);
        return (
          <button
            key={i}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() =>
              setTicked((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })
            }
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-3.5 text-start transition-colors",
              on ? "border-emerald-500/40 bg-emerald-500/[0.05]" : "border-border/70 hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                on ? "border-emerald-500 bg-emerald-500 text-white" : "border-border",
              )}
            >
              {on && <Check className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-medium", on && "text-muted-foreground line-through")}>
                {item.question}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {item.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
