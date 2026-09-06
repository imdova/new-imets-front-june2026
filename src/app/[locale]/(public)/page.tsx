import {
  ArrowRight,
  GraduationCap,
  Star,
  Users,
  BookOpen,
  Globe2,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/features/marketing/components/course-card";
import { MarketingHero } from "@/features/marketing/components/marketing-hero";
import { HealthcareFacultySection } from "@/features/marketing/components/healthcare-faculty-section";
import { TrustedBySection } from "@/features/marketing/components/trusted-by-section";
import { LearningJourneySection } from "@/features/marketing/components/learning-journey-section";
import { GoalNavigatorSection } from "@/features/marketing/components/goal-navigator-section";
import { WhyChooseImetsSection } from "@/features/marketing/components/why-choose-imets-section";
import { HealthcareSpecialtiesSection } from "@/features/marketing/components/healthcare-specialties-section";
import { ExploreCampusSection } from "@/features/marketing/components/explore-campus-section";
import { HealthcareInsightsSection } from "@/features/marketing/components/healthcare-insights-section";
import { WhyOrganizationsSection } from "@/features/marketing/components/why-organizations-section";
import { AlumniSection } from "@/features/marketing/components/alumni-section";
import { EducationalPhilosophySection } from "@/features/marketing/components/educational-philosophy-section";
import { AcademicDirectorSection } from "@/features/marketing/components/academic-director-section";
import { HomeFaqSection } from "@/features/marketing/components/home-faq-section";
import { SuccessMetricsSection } from "@/features/marketing/components/success-metrics-section";
import {
  CareerCtaSection,
  PartnersSection,
} from "@/features/marketing/components/home-marketing-sections";
import { brandedTitle, metaDescription, seoAlternates, socialMeta } from "@/lib/seo";
import { resolveSeoMetadata } from "@/lib/public-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Marketing" });
  /*
   * A dedicated SERP title, not the on-page H1.
   *
   * The homepage previously titled itself `${SITE_NAME} — ${t("heroTitle")}`,
   * which the layout template then suffixed with the brand again: 117
   * characters, brand twice, and not one word a person would search for. A
   * headline and a title tag have different jobs — the headline persuades
   * someone already on the page, the title has to win the click first.
   */
  const title = t("homeMetaTitle");
  const description = metaDescription(t("homeMetaDescription"));
  // Admin-managed SEO (settings + "/" page override) spread underneath so it
  // contributes fields the i18n defaults don't set (e.g. a site-wide noindex);
  // best-effort and never overrides the localized title/description below.
  const adminMeta = await resolveSeoMetadata("/").catch(() => ({} as Metadata));
  return {
    ...adminMeta,
    // Already names the school, so it opts out of the layout's brand template.
    title: brandedTitle(title),
    description,
    alternates: seoAlternates("/", locale),
    ...socialMeta({ title, description, path: "/", locale }),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Marketing");

  const coursesRes = await dal.courses.fetchCourses();
  // Home "Featured Healthcare Programs" should show more options.
  const courses = (coursesRes.ok ? coursesRes.data : []).slice(0, 8);

  const stats = [
    { value: "18,000+", label: t("heroStat1"), icon: Users },
    { value: "4.9", label: t("heroStat2"), icon: Star, rating: true },
    { value: "15+", label: t("heroStat3"), icon: Globe2 },
    { value: "38+", label: t("heroStat4"), icon: GraduationCap },
    { value: "64+", label: t("heroStat5"), icon: BookOpen },
  ];

  return (
    <>
      <MarketingHero stats={stats} videoId="SSlmmUH2Ado" />

      <TrustedBySection />

      {/* Featured courses */}
      <Section title={t("featuredTitle")} subtitle={t("featuredSubtitle")}
        action={<Button asChild variant="ghost" className="gap-1.5"><Link href="/courses">{t("viewAllCourses")}<ArrowRight className="size-4 rtl:rotate-180" /></Link></Button>}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </Section>

      {/* Why Choose IMETS — photo + value cards */}
      <WhyChooseImetsSection />

      <HealthcareSpecialtiesSection />

      {/* Career-first guidance — buy the outcome, not just the course */}
      <GoalNavigatorSection />

      {/* Learning experience — "what happens after I enroll?" */}
      <LearningJourneySection />

      {/* Our educational philosophy — Learn → Practice → Lead → Transform */}
      <EducationalPhilosophySection />

      {/* Explore Our Campus — platform preview */}
      <ExploreCampusSection />

      <HealthcareFacultySection />

      {/* Why healthcare organizations choose IMETS (B2B trust) */}
      <WhyOrganizationsSection />

      {/* Strong proof points before alumni / review-style sections */}
      <SuccessMetricsSection />

      {/* Meet Our Alumni — real outcomes (replaces testimonials) */}
      <AlumniSection />

      {/* Letter from the Academic Director — institutional trust */}
      <AcademicDirectorSection />

      <PartnersSection />

      {/* Healthcare Insights — latest articles (SEO) */}
      <HealthcareInsightsSection />

      <HomeFaqSection />

      <CareerCtaSection />
    </>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-balance font-heading text-2xl font-bold tracking-[-0.01em] text-[#0a2f7a] sm:text-3xl lg:text-[2rem]">
        {title}
      </h2>
      {subtitle && <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  centered,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  centered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
      <div
        className={
          centered
            ? "mx-auto max-w-2xl text-center"
            : "flex items-end justify-between gap-4"
        }
      >
        <Heading title={title} subtitle={subtitle} />
        {action}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
