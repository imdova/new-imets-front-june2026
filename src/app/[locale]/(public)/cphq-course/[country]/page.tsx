import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { JsonLd } from "@/components/seo/json-ld";
import { localeUrl, seoAlternates, breadcrumbLd, socialMeta } from "@/lib/seo";
import { mergeSeo } from "@/lib/public-seo";
import {
  getGeoCoursePage,
  geoContent,
  geoCoursePath,
  listGeoCoursePages,
} from "@/features/marketing/lib/geo-course-pages";
import {
  GeoCourseLanding,
  type GeoTestimonial,
} from "@/features/marketing/components/geo-course-landing";

/**
 * Country landing page for the CPHQ course (`/cphq-course/egypt`).
 *
 * Only countries with their own written content resolve — everything else
 * 404s rather than rendering a template with the place name swapped, which is
 * the doorway-page pattern Google penalises. See `geo-course-pages.ts`.
 */

export function generateStaticParams() {
  return listGeoCoursePages().map((p) => ({ country: p.country }));
}

/** Prices and consented reviews come from the same record the course page uses. */
async function loadCourse(slug: string) {
  const res = await dal.courses.fetchCourses();
  return (res.ok ? res.data : []).find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}): Promise<Metadata> {
  const { locale, country } = await params;
  const page = getGeoCoursePage(country);
  if (!page) return {};
  const c = geoContent(page, locale);
  const path = geoCoursePath(page);

  return mergeSeo(path, {
    // Absolute: the title already names the country and the credential, and the
    // layout's brand suffix would push it past the SERP truncation point.
    title: { absolute: c.title },
    description: c.metaDescription,
    /*
     * Self-referencing canonical. Pointing this at /courses/cphq-preparation
     * would tell Google the page is a duplicate and hand the ranking straight
     * back to the generic page — which is the problem this page exists to fix.
     */
    alternates: seoAlternates(path, locale),
    ...socialMeta({
      title: c.h1,
      description: c.metaDescription,
      path,
      locale,
    }),
  });
}

export default async function GeoCoursePageRoute({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  setRequestLocale(locale);

  const page = getGeoCoursePage(country);
  if (!page) notFound();

  const course = await loadCourse(page.courseSlug);
  if (!course || course.status !== "published") notFound();

  const c = geoContent(page, locale);
  const ar = locale === "ar";
  const courseTitle = ar ? course.titleAr || course.titleEn : course.titleEn;

  const price =
    page.currency === "SAR"
      ? { list: course.priceSAR ?? 0, sale: course.salePriceSAR ?? 0 }
      : page.currency === "USD"
        ? { list: course.priceUSD ?? 0, sale: course.salePriceUSD ?? 0 }
        : { list: course.priceEGP, sale: course.salePriceEGP };

  /*
   * Country-attributed testimonials, from the course's own consented reviews.
   *
   * `mapCourse` has already dropped anything without `consentToPublish`, so
   * this only narrows by country. It is empty today — the CPHQ record holds no
   * text reviews at all — and the section simply does not render. There is no
   * placeholder path: a fabricated Egyptian student is exactly the kind of
   * content this codebase spent a lint rule to make impossible.
   */
  const testimonials: GeoTestimonial[] = (course.textReviews ?? [])
    .filter((r) => (r.country ?? "").trim().toLowerCase() === page.countryCode.toLowerCase()
      || (r.country ?? "").trim().toLowerCase() === page.en.countryName.toLowerCase())
    .map((r) => ({
      name: r.reviewerName,
      role: r.title,
      quote: r.comment,
      rating: r.rating,
    }))
    .filter((t) => !!t.name && !!t.quote);

  const path = geoCoursePath(page);
  const crumb = breadcrumbLd([
    { name: ar ? "الرئيسية" : "Home", url: localeUrl("/", locale) },
    { name: ar ? "الكورسات" : "Courses", url: localeUrl("/courses", locale) },
    { name: courseTitle, url: localeUrl(`/courses/${page.courseSlug}`, locale) },
    { name: c.h1, url: localeUrl(path, locale) },
  ]);

  /*
   * FAQPage only — deliberately no second `Course` node. The course itself is
   * already described on /courses/cphq-preparation, and emitting a competing
   * Course entity for the same programme invites Google to treat one of the two
   * as a duplicate.
   */
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const applyWebhook =
    page.courseSlug === "cphq-preparation" ? "https://aut.jobova.net/webhook/cphq" : undefined;

  return (
    <>
      <JsonLd data={[crumb, faqLd]} />
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-4xl flex-wrap items-center gap-1 px-4 pt-8 text-xs text-muted-foreground sm:px-6"
      >
        <Link href="/" className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <Link href={`/courses/${page.courseSlug}`} className="hover:text-foreground">{courseTitle}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span className="line-clamp-1 text-foreground">{c.countryName}</span>
      </nav>

      <GeoCourseLanding
        page={page}
        locale={locale}
        courseId={course.id}
        courseTitle={courseTitle}
        listPrice={price.list}
        salePrice={price.sale}
        testimonials={testimonials}
        webhookUrl={applyWebhook}
      />
    </>
  );
}
