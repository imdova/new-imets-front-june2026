"use client";

import * as React from "react";
import { Check, Copy, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProgrammeNumbers } from "@/features/orientation/lib/sales-orientation";

/**
 * Programme numbers — the figures to have ready before price comes up.
 *
 * Every number here is read from the live course record rather than a copy kept
 * alongside the training text. A rep quoting a stale fee from a training page is
 * the exact failure this avoids: change a price in Admin → Courses and this
 * lesson changes with it. (Checked when this was built: all eight programmes
 * matched their course records on fee, lecture count and learner numbers.)
 *
 * The per-lecture cost is the point of the whole lesson. "Expensive" is almost
 * never an argument about the total; it is an argument about value that has not
 * been made concrete yet, and dividing by the lecture count is what makes it
 * concrete — which is why the answer to that objection is arithmetic, not a
 * discount.
 */

const eg = (n: number) => n.toLocaleString("en-US");

export function ProgramsModule({
  programmes,
  onComplete,
}: {
  programmes: ProgrammeNumbers[];
  onComplete: () => void;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const [seen, setSeen] = React.useState<Set<number>>(new Set());
  const [copied, setCopied] = React.useState(false);

  /** Half the catalogue is enough to learn the shape of the numbers. */
  const target = Math.min(3, programmes.length);

  React.useEffect(() => {
    if (seen.size >= target) onComplete();
  }, [seen, target, onComplete]);

  if (programmes.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
        تعذّر تحميل أسعار البرامج دلوقتي. حدّث الصفحة، ولو فضلت المشكلة ارجع
        لمشرف الفريق قبل ما تتكلم في السعر.
      </p>
    );
  }

  const p = active === null ? null : programmes[active];
  const perLecture = p && p.lectures > 0 ? Math.round(p.sale / p.lectures) : 0;
  const first = p ? Math.round(p.sale * 0.5) : 0;
  const off = p && p.price > 0 ? Math.round((1 - p.sale / p.price) * 100) : 0;

  const pitch = p
    ? `${p.name} عبارة عن ${p.lectures} محاضرة لايف على Zoom، محاضرة أسبوعيًا، مع تسجيلات متاحة ١٢ شهر ومهام تطبيقية وشهادة. الرسوم ${eg(p.sale)} جنيه، يعني تكلفة المحاضرة حوالي ${eg(perLecture)} جنيه. وتقدر تأكد مقعدك بدفعة أولى ${eg(first)} جنيه، والباقي خلال شهر من بداية البرنامج. تحب أبعتلك خطة الموديولات ومواعيد الدفعة الجاية؟`
    : "";

  const stats = p
    ? [
        { v: eg(p.sale), k: `الرسوم بالجنيه (بدل ${eg(p.price)})`, hi: false },
        { v: eg(perLecture), k: "تكلفة المحاضرة الواحدة", hi: true },
        { v: String(p.lectures), k: "محاضرة لايف على Zoom", hi: false },
        { v: eg(first), k: "الدفعة الأولى (٥٠٪)", hi: false },
        { v: eg(p.sale - first), k: "الباقي خلال شهر من البداية", hi: false },
        { v: `${off}%`, k: "نسبة الخصم الحالية", hi: false },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {programmes.map((prog, i) => (
          <button
            key={prog.slug}
            type="button"
            aria-pressed={active === i}
            onClick={() => {
              setActive(i);
              setSeen((s) => new Set(s).add(i));
              setCopied(false);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              active === i
                ? "border-primary bg-primary text-primary-foreground"
                : seen.has(i)
                  ? "border-emerald-500/40 bg-emerald-500/[0.05]"
                  : "border-border/70 hover:border-primary/40 hover:text-primary",
            )}
          >
            {prog.name}
          </button>
        ))}
      </div>

      {seen.size < target && (
        <p className="text-xs text-muted-foreground">
          افتح {target} برامج على الأقل عشان تكمّل الدرس ({seen.size} من {target})
        </p>
      )}

      {!p ? (
        <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
          اختار برنامجًا من فوق.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{p.subtitle}</p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.k}
                className={cn(
                  "rounded-2xl border p-3.5",
                  s.hi
                    ? "border-primary/40 bg-primary/[0.06]"
                    : "border-border/70 bg-card",
                )}
              >
                <span
                  className={cn(
                    "block font-heading text-2xl font-bold tabular-nums",
                    s.hi && "text-primary",
                  )}
                >
                  {s.v}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {s.k}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                صيغة جاهزة
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pitch);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  } catch {
                    // Clipboard blocked — the text is on screen and selectable.
                  }
                }}
                className="ms-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "اتنسخت" : "نسخ الصيغة"}
              </button>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">«{pitch}»</p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              انضم للبرنامج ده {eg(p.students)} متدرب حتى الآن.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
