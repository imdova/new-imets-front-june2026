import {
  ChevronRight, GraduationCap, Award, ShieldCheck, Briefcase, Users, Star, BookOpen,
  Video, Globe, Languages, BadgeCheck, ArrowRight, HelpCircle,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { CourseRow } from "@/types";
import type { PublicCategory } from "@/lib/dal/course-taxonomy";
import { CourseCard } from "./course-card";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, localeUrl, breadcrumbLd } from "@/lib/seo";

/* Pick a lucide icon per known category slug. */
const CAT_ICON: Record<string, React.ElementType> = {
  "healthcare-quality": Award,
  "infection-control": ShieldCheck,
  "healthcare-management": Briefcase,
};

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K` : `${n}`;

export function CategoryLanding({
  category,
  courses,
  related,
  locale,
}: {
  category: PublicCategory;
  courses: CourseRow[];
  related: PublicCategory[];
  locale: string;
}) {
  const ar = locale === "ar";
  const tr = (en: string, arText: string) => (ar ? arText : en);
  const pick = (en?: string, arText?: string) => (ar ? arText || en : en || arText) || "";

  const name = pick(category.nameEn, category.nameAr);
  const headline = pick(category.headlineEn, category.headlineAr);
  const description = pick(category.descriptionEn, category.descriptionAr);
  const Icon = CAT_ICON[category.slug] ?? GraduationCap;

  const students = courses.reduce((s, c) => s + (c.students || 0), 0);
  const rated = courses.filter((c) => c.rating > 0);
  const catUrl = localeUrl(`/category/${category.slug}`, locale);

  /*
   * Every number here has to come from stored data.
   *
   * This strip used to end `: 4.9` — with no rated course in the category, the
   * page displayed "4.9 Avg rating" out of thin air, the same fabrication that
   * was removed from the course pages. It sat beside a hardcoded "100%
   * Certified", which asserted nothing checkable at all.
   *
   * The rating stat now only appears when a course in this category actually
   * carries a rating, and the certified claim is replaced by the delivery mode,
   * which is true and already stated in the FAQ below.
   */
  const stats = [
    { icon: BookOpen, value: `${courses.length}`, label: tr("Programs", "برنامج") },
    ...(students > 0
      ? [{ icon: Users, value: `${compact(students)}+`, label: tr("Learners", "متعلم") }]
      : []),
    ...(rated.length
      ? [{
          icon: Star,
          value: (rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1),
          label: tr("Avg rating", "متوسط التقييم"),
        }]
      : []),
    { icon: BadgeCheck, value: "100%", label: tr("Online", "أونلاين") },
  ];

  const whyItems = [
    { icon: Video, title: tr("Live expert instruction", "تدريب مباشر من الخبراء"), body: tr("Learn live from practitioners, with every session recorded for review.", "تعلّم مباشرةً من المتخصصين، مع تسجيل كل جلسة للمراجعة.") },
    { icon: Globe, title: tr("Internationally aligned", "متوافق دوليًا"), body: tr("Curricula mapped to globally recognized standards and exams.", "مناهج متوافقة مع المعايير والامتحانات المعترف بها عالميًا.") },
    { icon: Languages, title: tr("Bilingual delivery", "محتوى ثنائي اللغة"), body: tr("Programs delivered in English with Arabic support throughout.", "برامج بالإنجليزية مع دعم كامل باللغة العربية.") },
    { icon: Award, title: tr("Career-recognized certificate", "شهادة معتمدة مهنيًا"), body: tr("Earn a verifiable certificate to advance across the region.", "احصل على شهادة موثّقة تدعم مسيرتك في المنطقة.") },
  ];

  // Category FAQs (bilingual), with sensible defaults when none are set.
  const faqs = category.faqs.length
    ? category.faqs.map((f) => ({ q: pick(f.questionEn, f.questionAr), a: pick(f.answerEn, f.answerAr) }))
    : [
        { q: tr(`Who are the ${name} programs for?`, `لمن برامج ${name}؟`), a: tr("Healthcare professionals looking to build expertise and earn recognized credentials in this specialty.", "للمتخصصين في الرعاية الصحية الراغبين في بناء الخبرة والحصول على شهادات معترف بها في هذا التخصص.") },
        { q: tr("Are the programs online?", "هل البرامج أونلاين؟"), a: tr("Yes — 100% online, with live sessions over Zoom plus recordings you can revisit anytime.", "نعم — أونلاين 100%، مع جلسات مباشرة عبر Zoom وتسجيلات يمكنك مراجعتها في أي وقت.") },
        { q: tr("Will I receive a certificate?", "هل سأحصل على شهادة؟"), a: tr("Yes — you earn a verifiable certificate of completion for your CV and LinkedIn.", "نعم — تحصل على شهادة إتمام موثّقة لسيرتك الذاتية وLinkedIn.") },
      ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: tr("Home", "الرئيسية"), url: localeUrl("/", locale) },
            { name: tr("Programs", "البرامج"), url: localeUrl("/courses", locale) },
            { name, url: catUrl },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-[100rem] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">{tr("Home", "الرئيسية")}</Link>
            <ChevronRight className="size-3.5 rtl:rotate-180" />
            <Link href="/courses" className="hover:text-foreground">{tr("Programs", "البرامج")}</Link>
            <ChevronRight className="size-3.5 rtl:rotate-180" />
            <span className="line-clamp-1 text-foreground">{name}</span>
          </nav>

          {/* Hero */}
          <section className="marketing-gradient-bg overflow-hidden rounded-[2rem] px-6 py-10 shadow-2xl shadow-blue-950/30 ring-1 ring-inset ring-white/10 sm:px-10 sm:py-12" dir={ar ? "rtl" : "ltr"}>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                <Icon className="size-4" /> {tr("Specialty", "تخصص")}
              </span>
              <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                {headline || name}
              </h1>
              {description && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-50/90 sm:text-lg">{description}</p>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#programs" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0b3fa8] shadow-sm transition-transform hover:-translate-y-0.5">
                  {tr("Browse programs", "تصفّح البرامج")}<ArrowRight className="size-4 rtl:rotate-180" />
                </a>
                <Link href="/contact" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/15">
                  {tr("Talk to an advisor", "تحدّث مع مستشار")}
                </Link>
              </div>
            </div>

            {/* Stat band */}
            <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15 backdrop-blur">
                  <span className="flex items-center gap-1.5 text-amber-300"><s.icon className="size-4" /></span>
                  <p className="mt-1.5 font-heading text-2xl font-bold text-white tabular-nums">{s.value}</p>
                  <p className="text-xs text-blue-100/80">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-16 py-14">
          {/* Programs */}
          <section id="programs" className="scroll-mt-24 space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0a2f7a]">
                {tr(`${name} Programs`, `برامج ${name}`)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr("Choose the program that matches your goal and experience.", "اختر البرنامج الذي يناسب هدفك وخبرتك.")}
              </p>
            </div>
            {courses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                {tr("New programs in this specialty are coming soon.", "برامج جديدة في هذا التخصص قريبًا.")}
              </p>
            )}
          </section>

          {/* Why this specialty */}
          <section className="space-y-6">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0a2f7a]">
              {tr(`Why study ${name} at ${SITE_NAME}`, `لماذا تدرس ${name} في ${SITE_NAME}`)}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {whyItems.map((w) => (
                <div key={w.title} className="rounded-2xl border border-border/70 bg-card p-5">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><w.icon className="size-5" /></span>
                  <p className="mt-3 font-semibold">{w.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-6" dir={ar ? "rtl" : "ltr"}>
            <h2 className="flex items-center gap-2 font-heading text-2xl font-bold tracking-tight text-[#0a2f7a]">
              <HelpCircle className="size-6 text-primary" />{tr("Frequently asked questions", "الأسئلة الشائعة")}
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-xl border border-border/70 bg-card px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                    {f.q}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:-rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Explore other specialties */}
          {related.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0a2f7a]">
                {tr("Explore other specialties", "استكشف تخصصات أخرى")}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => {
                  const RIcon = CAT_ICON[r.slug] ?? GraduationCap;
                  return (
                    <Link key={r.id} href={`/category/${r.slug}`} className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-md">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><RIcon className="size-5" /></span>
                      <div className="min-w-0">
                        <p className="font-semibold group-hover:text-primary">{pick(r.nameEn, r.nameAr)}</p>
                        {(r.descriptionEn || r.descriptionAr) && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pick(r.descriptionEn, r.descriptionAr)}</p>
                        )}
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                          {tr("View programs", "عرض البرامج")}<ArrowRight className="size-3.5 rtl:rotate-180" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Final CTA */}
          <section className="marketing-gradient-bg overflow-hidden rounded-[2rem] px-6 py-10 text-center shadow-xl ring-1 ring-inset ring-white/10 sm:px-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
              {tr(`Ready to advance in ${name}?`, `مستعد للتقدّم في ${name}؟`)}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-50/90">
              {tr("Talk to an advisor to find the right program for your goals and experience.", "تحدّث مع مستشار لتجد البرنامج المناسب لأهدافك وخبرتك.")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#programs" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0b3fa8] transition-transform hover:-translate-y-0.5">
                {tr("Browse programs", "تصفّح البرامج")}
              </a>
              <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 hover:bg-white/15">
                {tr("Contact us", "تواصل معنا")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
