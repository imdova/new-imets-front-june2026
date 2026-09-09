"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  MessageSquare,
  PartyPopper,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ORIENTATION_LESSONS,
  SALES_ORIENTATION,
  type Thread,
} from "@/features/orientation/lib/sales-orientation";
import { useOrientationProgress } from "@/features/orientation/hooks/use-orientation-progress";
import { useLessonHash } from "@/features/orientation/hooks/use-lesson-hash";
import {
  ChecklistModule,
  ClosingModule,
  PhraseBankModule,
  PracticeModule,
  RulesModule,
} from "./orientation-modules";

/**
 * Sales orientation, as a course rather than a document.
 *
 * One lesson on screen at a time, a curriculum rail that shows where you are
 * and what is left, and an explicit next step at the bottom of every lesson.
 * The earlier single-scroll version put all seven modules on one page, which
 * read as something to skim rather than something to work through — a new joiner
 * could not tell how much was left, and finishing a module produced no moment.
 *
 * Everything is RTL regardless of the console language: the content is Egyptian
 * Arabic dialogue, and mirroring it would put the speaker bubbles on the wrong
 * side.
 */

/* ── lesson 1: the contrast ──────────────────────────────────────────────── */

function ThreadView({ thread, tone }: { thread: Thread; tone: "bad" | "good" }) {
  /*
   * Messages land one after another. The lesson is that the bad thread *feels*
   * like an interrogation — five questions arriving in a row does that, the
   * same five in a static block does not.
   */
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    const timers = thread.messages.map((_, i) =>
      setTimeout(() => setShown(i + 1), 260 * i),
    );
    return () => timers.forEach(clearTimeout);
  }, [thread]);

  return (
    <div>
      <div className="space-y-2">
        {thread.messages.map((m, i) => {
          const visible = i < shown;
          const isClient = m.from === "client";
          return (
            <div
              key={i}
              className={cn(
                "flex transition-all duration-300",
                isClient ? "justify-start" : "justify-end",
                visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2",
                  isClient
                    ? "bg-muted text-foreground/90"
                    : tone === "bad"
                      ? "bg-destructive/10 ring-1 ring-destructive/25"
                      : "bg-emerald-500/10 ring-1 ring-emerald-500/25",
                )}
              >
                <span className="mb-0.5 block text-[11px] font-semibold text-muted-foreground">
                  {m.who}
                </span>
                <span className="text-sm leading-relaxed">{m.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "mt-4 flex items-start gap-2.5 rounded-2xl p-3.5 text-sm leading-relaxed transition-opacity duration-500",
          shown >= thread.messages.length ? "opacity-100" : "opacity-0",
          thread.verdict.tone === "good"
            ? "bg-emerald-500/[0.08] ring-1 ring-emerald-500/20"
            : "bg-destructive/[0.06] ring-1 ring-destructive/20",
        )}
      >
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            thread.verdict.tone === "good" ? "bg-emerald-500" : "bg-destructive",
          )}
        />
        <span>
          <b className="font-bold">{thread.verdict.lead}</b> {thread.verdict.rest}
        </span>
      </div>
    </div>
  );
}

function ContrastLesson({ onComplete }: { onComplete: () => void }) {
  const [tab, setTab] = React.useState<"bad" | "good">("bad");
  const [seen, setSeen] = React.useState<Set<string>>(new Set(["bad"]));

  React.useEffect(() => {
    // Completing means having compared both — one tab is half the lesson.
    if (seen.size >= 2) onComplete();
  }, [seen, onComplete]);

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MessageSquare className="size-3.5" />
        محادثة واردة على واتساب — استفسار عن دبلومة الجودة الصحية
      </p>

      <div className="mb-4 inline-flex rounded-xl bg-muted p-1" role="tablist">
        {(
          [
            ["bad", "أسلوب الاستجواب"],
            ["good", "أسلوب الاستشارة"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setSeen((p) => new Set(p).add(key));
            }}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Remounts on tab change so the reveal replays from the top. */}
      <ThreadView key={tab} thread={SALES_ORIENTATION.threads[tab]} tone={tab} />

      {seen.size < 2 && (
        <p className="mt-4 rounded-xl bg-primary/[0.06] p-3 text-center text-sm text-primary">
          شوف الأسلوبين الاتنين عشان تكمّل الدرس.
        </p>
      )}
    </div>
  );
}

/* ── lesson 2: the path ──────────────────────────────────────────────────── */

function PathLesson({ onComplete }: { onComplete: () => void }) {
  const steps = SALES_ORIENTATION.steps;
  const [active, setActive] = React.useState(0);
  const [seen, setSeen] = React.useState<Set<number>>(new Set([0]));

  React.useEffect(() => {
    if (seen.size >= steps.length) onComplete();
  }, [seen, steps.length, onComplete]);

  return (
    <div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((s, i) => {
          const isActive = active === i;
          return (
            <li key={s.title}>
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setSeen((p) => new Set(p).add(i));
                }}
                className={cn(
                  "w-full rounded-2xl border p-3 text-start transition-all",
                  isActive
                    ? "border-primary/50 bg-primary/[0.06] shadow-sm"
                    : seen.has(i)
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : "border-border/70 hover:border-primary/30",
                )}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  الخطوة {s.n}
                  {seen.has(i) && !isActive && <Check className="size-3 text-emerald-600" />}
                </span>
                <span className="mt-1 block text-sm font-bold leading-snug">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
        {steps[active].body}
      </p>
      {seen.size < steps.length && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          افتح الخطوات الخمسة كلها عشان تكمّل الدرس ({seen.size} من {steps.length})
        </p>
      )}
    </div>
  );
}

/* ── course shell ────────────────────────────────────────────────────────── */

export function SalesOrientation() {
  const lessons = ORIENTATION_LESSONS;
  const progress = useOrientationProgress(lessons.length);
  const { hash, go, pin } = useLessonHash();
  const { complete, done } = progress;

  /*
   * No fragment ⇒ resume at the first unfinished lesson. On the server that is
   * always lesson one (nothing is known to be complete); after hydration the
   * stored progress arrives and the learner lands where they left off.
   */
  const firstUnfinished = Math.max(
    0,
    lessons.findIndex((l) => !done.has(l.id)),
  );
  const hashIndex = lessons.findIndex((l) => l.id === hash);
  const index = hashIndex >= 0 ? hashIndex : firstUnfinished;
  const lesson = lessons[index];
  const isDone = done.has(lesson.id);

  const completeCurrent = React.useCallback(() => {
    complete(lesson.id);
    // Freeze the view here; see `pin` for why finishing a lesson would
    // otherwise advance it under the learner.
    pin(lesson.id);
  }, [complete, lesson.id, pin]);

  const goTo = (i: number) => {
    go(lessons[i].id);
    // A new lesson always starts at its own top, not wherever the last one ended.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const body = {
    contrast: <ContrastLesson onComplete={completeCurrent} />,
    path: <PathLesson onComplete={completeCurrent} />,
    rules: <RulesModule rules={SALES_ORIENTATION.rules} onComplete={completeCurrent} />,
    practice: (
      <PracticeModule scenarios={SALES_ORIENTATION.scenarios} onComplete={completeCurrent} />
    ),
    phrases: (
      <PhraseBankModule phrases={SALES_ORIENTATION.phraseBank} onComplete={completeCurrent} />
    ),
    closing: <ClosingModule closings={SALES_ORIENTATION.closings} onComplete={completeCurrent} />,
    checklist: (
      <ChecklistModule items={SALES_ORIENTATION.checklist} onComplete={completeCurrent} />
    ),
  }[lesson.id];

  return (
    <div dir="rtl" className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
      {/* Curriculum */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <ListChecks className="size-4 text-primary" />
              محتوى التدريب
            </span>
            <span className="text-sm font-bold text-primary">
              {progress.count}/{progress.total}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <ol className="mt-4 space-y-0.5">
            {lessons.map((l, i) => {
              const finished = done.has(l.id);
              const current = i === index;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-current={current ? "step" : undefined}
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-sm transition-colors",
                      current ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold",
                        finished
                          ? "bg-emerald-500 text-white"
                          : current
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {finished ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{l.short}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {progress.count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full gap-1.5 text-muted-foreground"
              onClick={progress.reset}
            >
              <RotateCcw className="size-3.5" />
              إعادة التقدّم
            </Button>
          )}
        </div>
      </aside>

      {/* Lesson */}
      <div className="min-w-0">
        <article className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
              الدرس {index + 1} من {lessons.length}
            </span>
            {isDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600">
                <Check className="size-3" />
                مكتمل
              </span>
            )}
            <span className="ms-auto text-muted-foreground">{lesson.en}</span>
          </div>

          <h2 className="mt-3 font-heading text-xl font-bold leading-snug tracking-tight sm:text-2xl">
            {lesson.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lesson.intro}</p>

          <div className="mt-6">{body}</div>
        </article>

        {/* Lesson navigation */}
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            {/* RTL: "previous" points right. */}
            <ArrowRight className="size-4" />
            السابق
          </Button>

          {index < lessons.length - 1 ? (
            <Button className="ms-auto gap-1.5" onClick={() => goTo(index + 1)}>
              الدرس التالي
              <ArrowLeft className="size-4" />
            </Button>
          ) : (
            progress.allDone && (
              <span className="ms-auto text-sm font-medium text-emerald-600">
                خلصت كل الدروس
              </span>
            )
          )}
        </div>

        {progress.allDone && index === lessons.length - 1 && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 text-center">
            <PartyPopper className="mx-auto size-8 text-emerald-600" />
            <h2 className="mt-3 font-heading text-xl font-bold">خلصت التدريب</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              دلوقتي عندك المسار، والقواعد الأربع، والصياغات الآمنة. ارجع لأي درس
              أي وقت قبل ما تبعت رد طويل.
            </p>
          </div>
        )}

        <p className="mt-6 rounded-xl bg-muted/50 p-3.5 text-center text-xs leading-relaxed text-muted-foreground">
          دليل داخلي لفريق مبيعات IMETS. لأي حالة مش واضحة، ارجع لمشرف الفريق قبل
          ما توعد العميل بأي حاجة.
        </p>
      </div>
    </div>
  );
}
