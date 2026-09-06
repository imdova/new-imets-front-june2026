import type { Metadata } from "next";
import {
  Star,
  Video,
  ThumbsUp,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { ReviewsShowcase } from "@/features/marketing/components/reviews-showcase";
import { SITE_NAME, seoAlternates, socialMeta } from "@/lib/seo";
import { mergeSeo } from "@/lib/public-seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title =
    locale === "ar"
      ? "قصص نجاح متخصصي الرعاية الصحية | IMETS"
      : "Healthcare Career Success Stories | IMETS Medical School";
  const description =
    locale === "ar"
      ? "اكتشف كيف طوّر الأطباء والممرضون والصيادلة وقادة الرعاية الصحية ومتخصصو الجودة مسيرتهم المهنية بعد الانضمام إلى IMETS Medical School عبر مصر ودول الخليج."
      : "How physicians, nurses, pharmacists and quality professionals across Egypt and the Gulf advanced their careers after training with IMETS.";
  return mergeSeo("/success-stories", {
    title,
    description,
    alternates: seoAlternates("/success-stories", locale),
    ...socialMeta({
      title: `${title} · ${SITE_NAME}`,
      description,
      path: "/success-stories",
      locale,
    }),
  });
}

export default async function SuccessStoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);

  const res = await dal.studentReviews.fetchPublicReviews();
  const reviews = res.ok ? res.data : [];

  const videoCount = reviews.filter(
    (r) => r.kind === "video" || r.kind === "graduation",
  ).length;
  const fbCount = reviews.filter((r) => r.kind === "facebook").length;
  const waCount = reviews.filter((r) => r.kind === "whatsapp").length;

  const stats = [
    { icon: Star, value: "4.9", label: tr("Average rating", "متوسط التقييم") },
    {
      icon: Video,
      value: `${videoCount || 0}`,
      label: tr("Graduate stories", "قصص الخريجين"),
    },
    {
      icon: ThumbsUp,
      value: `${fbCount || 0}`,
      label: tr("Verified Facebook Recommendations", "توصيات فيسبوك موثّقة"),
    },
    {
      icon: MessageCircle,
      value: `${waCount || 0}`,
      label: tr("Messages from professionals", "رسائل من المتخصصين"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground">
            {tr("Home", "الرئيسية")}
          </Link>
          <ChevronRight className="size-3.5 rtl:rotate-180" />
          <span className="text-foreground">
            {tr("Success Stories", "قصص النجاح")}
          </span>
        </nav>

        <section
          className="marketing-gradient-bg overflow-hidden rounded-[2rem] px-6 py-10 shadow-2xl shadow-blue-950/30 ring-1 ring-inset ring-white/10 sm:px-10 sm:py-12"
          dir={ar ? "rtl" : "ltr"}
        >
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              <Star className="size-4 fill-current" />{" "}
              {tr("Success Stories", "قصص النجاح")}
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {tr(
                "Success Stories From Healthcare Professionals Across the Middle East",
                "قصص نجاح من متخصصي الرعاية الصحية عبر الشرق الأوسط",
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-50/90 sm:text-lg">
              {tr(
                "Discover how physicians, nurses, pharmacists, healthcare leaders, and quality professionals across Egypt and the GCC advanced their careers after joining IMETS Medical School.",
                "اكتشف كيف طوّر الأطباء والممرضون والصيادلة وقادة الرعاية الصحية ومتخصصو الجودة مسيرتهم المهنية عبر مصر ودول الخليج بعد الانضمام إلى IMETS Medical School.",
              )}
            </p>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15 backdrop-blur"
              >
                <span className="flex items-center gap-1.5 text-amber-300">
                  <s.icon className="size-4" />
                </span>
                <p className="mt-1.5 font-heading text-2xl font-bold text-white tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs text-blue-100/80">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="py-14">
          <ReviewsShowcase reviews={reviews} locale={locale} />
        </div>

        <section className="mb-14 marketing-gradient-bg overflow-hidden rounded-[2rem] px-6 py-10 text-center shadow-xl ring-1 ring-inset ring-white/10 sm:px-10">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
            {tr(
              "Join the Next Healthcare Professionals Cohort",
              "انضم إلى الدفعة القادمة من متخصصي الرعاية الصحية",
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-blue-50/90">
            {tr(
              "Secure your place with healthcare professionals building careers hospitals across Egypt & the GCC are hiring for.",
              "احجز مكانك مع متخصصي الرعاية الصحية الذين يبنون مسارات مهنية توظّف من أجلها المستشفيات في مصر ودول الخليج.",
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0b3fa8] transition-transform hover:-translate-y-0.5"
            >
              {tr("Reserve Your Seat", "احجز مقعدك")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/15"
            >
              {tr("Talk To An Admissions Advisor", "تحدّث مع مستشار القبول")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
