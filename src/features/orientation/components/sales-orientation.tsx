"use client";

import * as React from "react";
import { Check, MessageSquare, PartyPopper, RotateCcw, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SALES_ORIENTATION,
  ORIENTATION_MODULES,
  type Thread,
} from "@/features/orientation/lib/sales-orientation";
import { useOrientationProgress } from "@/features/orientation/hooks/use-orientation-progress";
import {
  ChecklistModule,
  ClosingModule,
  PhraseBankModule,
  PracticeModule,
  RulesModule,
} from "./orientation-modules";

/**
 * Sales-team orientation — the interactive version of the onboarding guide.
 *
 * The whole surface is forced to RTL regardless of the console's language: the
 * content is Egyptian Arabic dialogue, and rendering it LTR would put the
 * speaker bubbles and the conversation arrows on the wrong side, which is the
 * one thing this page cannot get wrong.
 */

/* ── the opening contrast ────────────────────────────────────────────────── */

function ThreadView({ thread, tone }: { thread: Thread; tone: "bad" | "good" }) {
  /*
   * Messages arrive one after another rather than all at once. The point of
   * the module is that the bad thread *feels* like an interrogation — five
   * questions landing in a row does that; the same five in a static block does
   * not.
   */
  const [shown, setShown] = React.useState(0);

  /*
   * Only schedules; it never resets `shown` synchronously. Switching tabs
   * remounts this component via a `key`, which is what clears the counter —
   * cheaper and less error-prone than tearing state down inside an effect.
   */
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
                    ? "bg-white/10 text-white/90"
                    : tone === "bad"
                      ? "bg-rose-400/20 text-white ring-1 ring-rose-300/30"
                      : "bg-emerald-400/20 text-white ring-1 ring-emerald-300/30",
                )}
              >
                <span className="mb-0.5 block text-[11px] font-semibold text-white/60">
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
            ? "bg-emerald-400/15 text-emerald-50 ring-1 ring-emerald-300/25"
            : "bg-rose-400/15 text-rose-50 ring-1 ring-rose-300/25",
        )}
      >
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            thread.verdict.tone === "good" ? "bg-emerald-300" : "bg-rose-300",
          )}
        />
        <span>
          <b className="font-bold">{thread.verdict.lead}</b> {thread.verdict.rest}
        </span>
      </div>
    </div>
  );
}

/* ── section wrapper ─────────────────────────────────────────────────────── */

function Module({
  id,
  index,
  title,
  intro,
  done,
  children,
}: {
  id: string;
  index: number;
  title: string;
  intro: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors",
            done ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
          )}
        >
          {done ? <Check className="size-4" /> : index}
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{intro}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export function SalesOrientation() {
  const data = SALES_ORIENTATION;
  const modules = ORIENTATION_MODULES;
  const progress = useOrientationProgress(modules.length);
  const { complete } = progress;

  const [tab, setTab] = React.useState<"bad" | "good">("good");
  const [pathStep, setPathStep] = React.useState(0);

  // Stable callbacks so the modules' completion effects do not re-fire.
  const done = React.useMemo(
    () => Object.fromEntries(modules.map((m) => [m.id, () => complete(m.id)])),
    [modules, complete],
  ) as Record<string, () => void>;

  return (
    <div dir="rtl" className="space-y-8">
      {/* Hero: the whole argument in two threads. */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2f7a] via-[#0b3fa8] to-[#1111D4] p-6 text-white sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          اليوم الأول — قبل ما ترد على أول عميل
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold leading-tight sm:text-3xl">
          نفس العميل، ونفس البرنامج، وردّين مختلفين تمامًا
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
          شغلك مش إنك تبعت تفاصيل الكورس. شغلك إنك تفهم العميل عايز إيه، وتساعده
          يقرر إن كان البرنامج ده مناسب لهدفه ولا لأ. جرّب الردّين تحت وشوف الفرق.
        </p>

        <div className="mt-6 rounded-2xl bg-black/20 p-4 backdrop-blur-sm sm:p-5">
          <p className="mb-3 flex items-center gap-1.5 text-xs text-white/60">
            <MessageSquare className="size-3.5" />
            محادثة واردة على واتساب — استفسار عن دبلومة الجودة الصحية
          </p>
          <div className="mb-4 inline-flex rounded-xl bg-white/10 p-1" role="tablist">
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
                onClick={() => setTab(key)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                  tab === key ? "bg-white text-[#0a2f7a]" : "text-white/70 hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* `key` remounts on tab change so the reveal replays from the top. */}
          <ThreadView key={tab} thread={data.threads[tab]} tone={tab} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_16rem] lg:gap-10">
        <div className="min-w-0 space-y-10">
          {/* Conversation path */}
          <Module
            id="path"
            index={1}
            title="مسار المحادثة من أولها لآخرها"
            intro="ده الترتيب اللي بيخلي الحوار استشاري بدل ما يكون عرض كورسات وأسعار. لو اتخطّيت خطوة، غالبًا العميل هيقف عند «هفكر وأرد عليك»."
            done={progress.done.has("path")}
          >
            <div className="grid gap-2 sm:grid-cols-5">
              {data.steps.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onMouseEnter={() => setPathStep(i)}
                  onFocus={() => setPathStep(i)}
                  onClick={() => {
                    setPathStep(i);
                    if (i === data.steps.length - 1) done.path();
                  }}
                  className={cn(
                    "rounded-2xl border p-3 text-start transition-all",
                    pathStep === i
                      ? "border-primary/50 bg-primary/[0.06] shadow-sm"
                      : "border-border/70 hover:border-primary/30",
                  )}
                >
                  <span className="text-[11px] font-semibold text-primary">الخطوة {s.n}</span>
                  <span className="mt-1 block text-sm font-bold leading-snug">{s.title}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-muted/60 p-3.5 text-sm leading-relaxed">
              {data.steps[pathStep].body}
            </p>
          </Module>

          <Module
            id="rules"
            index={2}
            title="القواعد الأربع"
            intro="كل قاعدة فيها الغلط الشائع، الصح، والمعادلة اللي تحفظها. اضغط على أي قاعدة تفتحها."
            done={progress.done.has("rules")}
          >
            <RulesModule rules={data.rules} onComplete={done.rules} />
          </Module>

          <Module
            id="practice"
            index={3}
            title="تدريب: اختار الرد الأنسب"
            intro="ستة مواقف حقيقية بتيجيلنا كل أسبوع. اختار ردًا واحدًا في كل موقف، وهيوصلك تعليق يوضح القاعدة اللي اتطبّقت."
            done={progress.done.has("practice")}
          >
            <PracticeModule scenarios={data.scenarios} onComplete={done.practice} />
          </Module>

          <Module
            id="phrases"
            index={4}
            title="جمل ممنوعة وبدائلها"
            intro="الجمل دي بتوعد بحاجة مش تحت سيطرتنا، وبتفتح باب شكاوى واسترداد أموال بعدين. اضغط على أي كارت تشوف الصياغة البديلة."
            done={progress.done.has("phrases")}
          >
            <PhraseBankModule phrases={data.phraseBank} onComplete={done.phrases} />
          </Module>

          <Module
            id="closing"
            index={5}
            title="صياغة الخطوة التالية"
            intro="اختار حالة العميل، وهتلاقي صيغة إقفال جاهزة تعدّلها على كلامك. المهم إن كل محادثة تنتهي بسؤال، مش بـ«أنا موجود لو احتجت»."
            done={progress.done.has("closing")}
          >
            <ClosingModule closings={data.closings} onComplete={done.closing} />
          </Module>

          <Module
            id="checklist"
            index={6}
            title="قبل ما تبعت الرسالة"
            intro="راجع الست نقاط دي على أي رد طويل قبل ما تضغط إرسال."
            done={progress.done.has("checklist")}
          >
            <ChecklistModule items={data.checklist} onComplete={done.checklist} />
          </Module>

          {progress.allDone && (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.07] p-6 text-center">
              <PartyPopper className="mx-auto size-8 text-emerald-600" />
              <h2 className="mt-3 font-heading text-xl font-bold">خلصت التدريب</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                دلوقتي عندك المسار، والقواعد الأربع، والصياغات الآمنة. ارجع للصفحة دي
                أي وقت قبل ما تبعت رد طويل.
              </p>
            </div>
          )}

          <p className="rounded-xl bg-muted/50 p-3.5 text-center text-xs leading-relaxed text-muted-foreground">
            دليل داخلي لفريق مبيعات IMETS. لأي حالة مش واضحة، ارجع لمشرف الفريق قبل
            ما توعد العميل بأي حاجة.
          </p>
        </div>

        {/* Progress rail */}
        <aside className="order-first lg:order-none">
          <div className="lg:sticky lg:top-20">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">تقدّمك</span>
                <span className="text-sm font-bold text-primary">
                  {progress.count} من {progress.total}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <nav className="mt-4 space-y-0.5">
                {modules.slice(1).map((m, i) => {
                  const isDone = progress.done.has(m.id);
                  return (
                    <a
                      key={m.id}
                      href={`#${m.id}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold",
                          isDone ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isDone ? <Check className="size-3" /> : i + 1}
                      </span>
                      <span className={cn("min-w-0 truncate", isDone && "text-muted-foreground")}>
                        {m.title}
                      </span>
                    </a>
                  );
                })}
              </nav>

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
          </div>
        </aside>
      </div>
    </div>
  );
}
