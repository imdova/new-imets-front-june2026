import { getTranslations } from "next-intl/server";
import { Sparkles, Star, ArrowRight, Check, type LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { YouTubePlayer } from "@/features/marketing/components/youtube-player";

interface MarketingHeroProps {
  stats: { value: string; label: string; icon?: LucideIcon; rating?: boolean }[];
  /** YouTube id for the hero intro video (click-to-play, no forced sound). */
  videoId?: string;
}

/** Small overlapping learner faces — Coursera-style social proof next to the video. */
const LEARNER_FACES = [
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=96&h=96&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=96&h=96&fit=crop&crop=faces&q=80",
];

/**
 * Modern two-column hero: badge + headline + CTAs + social proof on one side,
 * a framed click-to-play intro video on the other. Royal-blue campaign gradient
 * with gold CTA accents; a stats band follows underneath.
 */
export async function MarketingHero({ stats, videoId = "R9-6cBqzczo" }: MarketingHeroProps) {
  const t = await getTranslations("Marketing");
  const satisfaction = stats.find((s) => s.rating) ?? stats.find((s) => s.value.includes(".")) ?? stats[1];
  const valueBadges = [t("heroBadge1"), t("heroBadge2"), t("heroBadge3")] as const;

  return (
    <>
      <section className="relative overflow-hidden marketing-gradient-bg">
        <div className="pointer-events-none absolute inset-0 marketing-hero-grid opacity-40" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-24 top-16 size-80 rounded-full bg-[#f4c430]/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-8 size-96 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:grid-cols-2 lg:gap-12 lg:pb-24 lg:px-8">
          {/* Copy */}
          <div className="text-center lg:text-start">
            {satisfaction && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f4c430] px-3 py-1 text-xs font-bold text-[#051a4a] shadow">
                <Sparkles className="size-3.5" />
                <strong className="font-bold">{satisfaction.value}</strong> {satisfaction.label}
              </span>
            )}

            <h1 className="mt-5 text-balance font-heading text-3xl font-extrabold leading-[1.12] tracking-[-0.02em] text-white sm:text-4xl lg:text-[2.5rem]">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/80 sm:text-xl lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <p className="mx-auto mt-5 max-w-xl text-center text-sm font-semibold leading-relaxed text-white/90 sm:text-base lg:mx-0 lg:text-start">
              {t("heroTrustedByLine")}
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
              <Link
                href="/courses"
                className={cn(
                  "group inline-flex h-12 min-w-[12rem] items-center justify-center gap-2 rounded-full px-8 text-base font-bold transition-all duration-200",
                  "bg-[#f4c430] text-[#051a4a] shadow-lg shadow-black/25 hover:-translate-y-0.5 hover:bg-[#e0b020] hover:shadow-xl",
                )}
              >
                {t("browseCourses")}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </Link>
              <a
                href="#hero-video"
                className={cn(
                  "inline-flex h-12 min-w-[12rem] items-center justify-center rounded-full px-8 text-base font-semibold text-white ring-2 ring-inset ring-white/40 backdrop-blur transition-all duration-200",
                  "bg-white/10 hover:bg-white/20 hover:ring-white/60",
                )}
              >
                {t("watchStudentStories")}
              </a>
            </div>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
              {valueBadges.map((label) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90"
                >
                  <Check className="size-4 shrink-0 text-[#f4c430]" strokeWidth={2.75} />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Intro video + Coursera-style trust strip */}
          <div id="hero-video" className="relative mx-auto w-full max-w-xl scroll-mt-28">
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[#1e6ef0]/25 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#f4c430]/50 shadow-2xl shadow-black/40 ring-1 ring-white/15">
              <YouTubePlayer videoId={videoId} autoPlay={false} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md sm:justify-start lg:gap-4">
              <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                {LEARNER_FACES.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full border-2 border-[#0a2f7a] object-cover shadow-sm"
                    style={{ zIndex: LEARNER_FACES.length - i }}
                  />
                ))}
              </div>

              <div className="flex min-w-0 flex-col gap-0.5 text-center sm:text-start">
                {/* The star rating that sat here was unsourced — see the stats
                    array in the home page. The learner count beside it is a
                    real business figure, so the badge keeps that and drops the
                    number nobody can vouch for. */}
                <p className="text-xs font-medium leading-snug text-white/85 sm:text-sm">
                  {t("heroSocialProof")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 w-full max-w-6xl px-4 pb-16 sm:-mt-16 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center font-heading text-lg font-bold tracking-tight text-[#0a2f7a] sm:text-xl">
          {t("numbersTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-blue-100 bg-white px-4 py-6 text-center shadow-md transition-all hover:-translate-y-1 hover:border-[#0b3fa8]/40 hover:shadow-lg"
            >
              {s.rating ? (
                <>
                  <span className="flex gap-0.5 text-[#f4c430]" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </span>
                  <p className="font-heading text-3xl font-extrabold tracking-tight text-[#0a2f7a] tabular-nums sm:text-4xl">
                    {s.value}
                  </p>
                </>
              ) : (
                <p className="font-heading text-3xl font-extrabold tracking-tight text-[#0a2f7a] tabular-nums sm:text-4xl">
                  {s.value}
                </p>
              )}
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
