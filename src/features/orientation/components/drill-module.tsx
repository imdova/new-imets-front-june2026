"use client";

import * as React from "react";
import { Check, RefreshCw, Timer, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Objection } from "@/features/orientation/lib/sales-orientation";

/**
 * Rapid objection drill.
 *
 * A random objection appears and a clock starts. The rep answers it out loud
 * before revealing the model reply, then rates themselves against the four
 * steps. Reading the bank teaches recognition; this is the only part that
 * rehearses production under time pressure, which is the thing that actually
 * fails on a live call.
 *
 * The 45-second mark is highlighted rather than enforced — a customer will wait
 * a few seconds for a considered answer, and a hard cut-off would train speed
 * over accuracy.
 */

const WARN_AT = 45;

type Rating = "full" | "partial" | "revisit";

const RATINGS: { value: Rating; label: string; good: boolean }[] = [
  { value: "full", label: "طبّقت الأربع خطوات", good: true },
  { value: "partial", label: "نصّها تقريبًا", good: false },
  { value: "revisit", label: "لأ، محتاج أراجع", good: false },
];

/** Rounds to finish before the lesson counts as done. */
const TARGET_ROUNDS = 3;

export function DrillModule({
  objections,
  onComplete,
}: {
  objections: Objection[];
  onComplete: () => void;
}) {
  const [current, setCurrent] = React.useState<number | null>(null);
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [rating, setRating] = React.useState<Rating | null>(null);
  const [rounds, setRounds] = React.useState(0);
  const [applied, setApplied] = React.useState(0);

  // The clock is an interval, not derived state — an effect is the right home.
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  React.useEffect(() => {
    if (rounds >= TARGET_ROUNDS) onComplete();
  }, [rounds, onComplete]);

  const next = () => {
    // Never the same objection twice running, so the drill cannot be gamed.
    let i = Math.floor(Math.random() * objections.length);
    if (objections.length > 1) {
      while (i === current) i = Math.floor(Math.random() * objections.length);
    }
    setCurrent(i);
    setSeconds(0);
    setRunning(true);
    setRevealed(false);
    setRating(null);
  };

  const reveal = () => {
    setRunning(false);
    setRevealed(true);
  };

  const rate = (r: Rating) => {
    if (rating) return;
    setRating(r);
    setRounds((n) => n + 1);
    if (RATINGS.find((x) => x.value === r)?.good) setApplied((n) => n + 1);
  };

  const o = current === null ? null : objections[current];
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-bold tabular-nums transition-colors",
            seconds >= WARN_AT ? "bg-amber-500/20 text-amber-700" : "bg-card",
          )}
        >
          <Timer className="size-3.5" />
          {mm}:{ss}
        </span>
        <span className="text-sm text-muted-foreground">
          جولات: <b className="text-foreground">{rounds}</b> · طبّقت الأربع خطوات:{" "}
          <b className="text-emerald-600">{applied}</b>
        </span>
        {rounds < TARGET_ROUNDS && (
          <span className="ms-auto text-xs text-muted-foreground">
            كمّل {TARGET_ROUNDS} جولات عشان تخلّص الدرس
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4">
        {o ? (
          <p className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
            <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
              العميل
            </span>
            «{o.objection}»
          </p>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            اضغط «اعتراض جديد» عشان تبدأ.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={next} className="gap-1.5">
            <RefreshCw className="size-3.5" />
            اعتراض جديد
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={reveal}
            disabled={!o || revealed}
            className="gap-1.5"
          >
            اعرض الرد النموذجي
          </Button>
        </div>

        {revealed && o && (
          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
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
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                <Check className="size-3.5" />
                الرد النموذجي
              </p>
              <p className="mt-1 text-sm leading-relaxed">{o.right}</p>
            </div>

            <div className="rounded-xl bg-primary/[0.06] p-3 ring-1 ring-primary/20">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                الخطوة التالية
              </p>
              <p className="mt-1 text-sm leading-relaxed">{o.next}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-sm font-medium">قيّم نفسك:</span>
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  disabled={!!rating}
                  onClick={() => rate(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    rating === r.value
                      ? r.good
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                        : "border-primary bg-primary/10 text-primary"
                      : rating
                        ? "border-border/50 text-muted-foreground opacity-50"
                        : "border-border/70 hover:border-primary/40",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
