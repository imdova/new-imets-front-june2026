import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Sparkles, PlayCircle, GraduationCap, Video, Clock, BadgeCheck, MousePointerClick, Mail, ArrowRight } from "lucide-react";

import { dal } from "@/lib/dal";
import { Link } from "@/i18n/navigation";
import { mergeSeo } from "@/lib/public-seo";
import { seoAlternates, socialMeta, localeUrl, SITE_NAME } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { FreeCoursesExplorer } from "@/features/free-courses/components/free-courses-explorer";
import { CourseLectureCard } from "@/features/free-courses/components/course-lecture-card";

const tr = (locale: string, en: string, ar: string) => (locale === "ar" ? ar : en);

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = tr(
    locale,
    "Free Healthcare Courses & Lectures Online | IMETS",
    "كورسات ومحاضرات رعاية صحية مجانية أونلاين | IMETS",
  );
  const description = tr(
    locale,
    "Watch free healthcare lectures online — hospital management, healthcare quality, infection control and more. Free access, no payment required.",
    "شاهد محاضرات مجانية في الرعاية الصحية أونلاين — إدارة المستشفيات، وجودة الرعاية، ومكافحة العدوى وغيرها. وصول مجاني بالكامل.",
  );
  return mergeSeo("/free-courses", {
    title,
    description,
    alternates: seoAlternates("/free-courses", locale),
    ...socialMeta({ title, description, path: "/free-courses", locale }),
  });
}

export default async function FreeCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const res = await dal.freeCourses.fetchFreePrograms();
  const programs = res.ok ? res.data : [];

  // Real platform courses → each opens its own free-lecture landing page.
  const coursesRes = await dal.courses.fetchCourses();
  const courses = (coursesRes.ok ? coursesRes.data : []).filter((c) => c.status === "published");
  // Map a course slug to its free-lecture landing page; default to the CPHQ LP.
  const FREE_LECTURE_LP: Record<string, string> = {
    "cphq-preparation": "/lp/free-lecture-cphq-arab",
    "healthcare-quality-management-diploma": "/lp/free-lecture-quality-diploma-arab",
    "cic-preparation": "/lp/free-lecture-cic-arab",
    "infection-control-diploma": "/lp/free-lecture-infection-control-arab",
    "hospital-management-diploma": "/lp/free-lecture-hospital-management-arab",
    "healthcare-marketing-diploma": "/lp/free-lecture-healthcare-marketing-arab",
    "healthcare-hr-management-diploma": "/lp/free-lecture-hr-management-arab",
    "healthcare-strategic-management-diploma": "/lp/free-lecture-strategic-management-arab",
    "healthcare-supply-chain-diploma": "/lp/free-lecture-supply-chain-arab",
    "financial-management-course": "/lp/free-lecture-financial-management-arab",
  };
  const lpFor = (slug: string) => FREE_LECTURE_LP[slug] ?? "/lp/free-lecture-cphq-arab";

  const totalLectures = programs.reduce((s, p) => s + (p.lectureCount || p.lectures.length), 0);
  const totalHours = Math.round(programs.reduce((s, p) => s + p.lectures.reduce((a, l) => a + (l.durationMinutes || 0), 0), 0) / 60);
  const programCount = courses.length || programs.length;
  const STATS = [
    { icon: GraduationCap, value: `${programCount}`, label: tr(locale, "Programs", "برنامج") },
    { icon: Video, value: `${totalLectures || programCount}+`, label: tr(locale, "Free lectures", "محاضرة مجانية") },
    { icon: Clock, value: totalHours > 0 ? `${totalHours}+` : "—", label: tr(locale, "Hours", "ساعة") },
    { icon: BadgeCheck, value: "100%", label: tr(locale, "Free", "مجاني") },
  ];
  const STEPS = [
    { icon: MousePointerClick, t: tr(locale, "Pick a topic", "اختر موضوعًا"), b: tr(locale, "Browse free lectures from our real programs.", "تصفّح محاضرات مجانية من برامجنا الحقيقية.") },
    { icon: Mail, t: tr(locale, "Enter your email", "أدخل بريدك"), b: tr(locale, "One short form — no card, no payment.", "نموذج قصير واحد — بدون بطاقة أو دفع.") },
    { icon: PlayCircle, t: tr(locale, "Watch instantly", "شاهد فورًا"), b: tr(locale, "Get instant access and start learning.", "احصل على وصول فوري وابدأ التعلّم.") },
  ];

  return (
    <>
      {programs.length > 0 && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: tr(locale, "Free Healthcare Courses", "كورسات رعاية صحية مجانية"),
              itemListElement: programs.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Course",
                  name: (locale === "ar" ? p.titleAr : p.titleEn) || p.titleEn,
                  description: (locale === "ar" ? p.descriptionAr : p.descriptionEn) || undefined,
                  url: localeUrl(`/free-courses/${p.slug}`, locale),
                  provider: { "@type": "EducationalOrganization", name: SITE_NAME },
                  // Free courses must declare a zero-price offer to be eligible
                  // for Google's course rich results.
                  offers: { "@type": "Offer", price: 0, priceCurrency: "EGP", category: "Free" },
                },
              })),
            },
          ]}
        />
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-[#082a6b] text-primary-foreground">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 size-72 rounded-full bg-[#f4c430]/15 blur-3xl" />
        <div className="mx-auto w-full max-w-4xl px-4 py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">
            <Sparkles className="size-3.5" /> {tr(locale, "100% FREE — no card required", "مجاني ١٠٠٪ — بدون بطاقة")}
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl font-heading text-3xl font-extrabold leading-tight text-balance sm:text-4xl lg:text-[2.75rem]">
            {tr(locale, "Free lectures from our real ", "محاضرات مجانية من ")}
            <span className="text-[#f4c430]">{tr(locale, "healthcare programs", "برامجنا الصحية الحقيقية")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {tr(
              locale,
              "Watch real lectures from our CPHQ, infection control, hospital management and quality programs — completely free. Pick a topic and start learning today.",
              "شاهد محاضرات حقيقية من برامج CPHQ، ومكافحة العدوى، وإدارة المستشفيات، والجودة — مجانية تمامًا. اختر موضوعًا وابدأ التعلّم النهاردة.",
            )}
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 text-center backdrop-blur">
                <s.icon className="mx-auto mb-1.5 size-5 text-[#f4c430]" />
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-[11px] text-white/75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Free lecture per real course ── */}
      {courses.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-primary">{tr(locale, "By program", "حسب البرنامج")}</span>
            <h2 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">{tr(locale, "Pick a course, watch a free lecture", "اختر كورس وشاهد محاضرة مجانية")}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {tr(locale, "Every program starts with a free introductory lecture — no payment, no card.", "كل برنامج بيبدأ بمحاضرة تعريفية مجانية — بدون دفع أو بطاقة.")}
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => (
              <CourseLectureCard key={c.id} locale={locale} course={c} href={lpFor(c.slug)} />
            ))}
          </div>
        </section>
      )}

      {programs.length > 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto mb-2 max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-primary">{tr(locale, "Watch on-site", "شاهد على المنصّة")}</span>
            <h2 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">{tr(locale, "Recorded free lecture series", "سلاسل محاضرات مجانية مسجّلة")}</h2>
          </div>
          <FreeCoursesExplorer locale={locale} programs={programs} />
        </div>
      )}

      {programs.length === 0 && courses.length === 0 && (
        <div className="mx-auto my-14 flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </span>
          <p className="font-medium">{tr(locale, "Free courses are coming soon", "الكورسات المجانية قريبًا")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {tr(locale, "We're putting the finishing touches on our free lectures. Check back shortly.", "نضع اللمسات الأخيرة على محاضراتنا المجانية. تابعنا قريبًا.")}
          </p>
        </div>
      )}

      {/* ── How it works ── */}
      {(programs.length > 0 || courses.length > 0) && (
        <section className="bg-muted/30 py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">{tr(locale, "How it works", "إزاي بيشتغل")}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((st, i) => (
                <div key={st.t} className="relative rounded-2xl border border-border/70 bg-card p-5 text-center">
                  <span className="absolute end-4 top-4 text-4xl font-black text-primary/10">{i + 1}</span>
                  <span className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><st.icon className="size-6" /></span>
                  <h3 className="font-bold">{st.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{st.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Related to full programs ── */}
      <section className="bg-gradient-to-br from-primary to-[#082a6b] py-14 text-center text-primary-foreground">
        <div className="mx-auto max-w-2xl space-y-4 px-4">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">{tr(locale, "Ready for the full certification?", "جاهز للشهادة الكاملة؟")}</h2>
          <p className="text-sm opacity-90 sm:text-base">
            {tr(
              locale,
              "These free lectures are a taste of our full, certified programs — live sessions, exam prep and internationally recognized certificates.",
              "المحاضرات المجانية دي عيّنة من برامجنا الكاملة المعتمدة — جلسات مباشرة، تحضير للامتحان، وشهادات معترف بيها دوليًا.",
            )}
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-[#f4c430] px-6 py-3 text-sm font-extrabold text-[#0a1424] transition hover:bg-[#f4c430]/90"
          >
            {tr(locale, "Explore all programs", "تصفّح كل البرامج")}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </>
  );
}
