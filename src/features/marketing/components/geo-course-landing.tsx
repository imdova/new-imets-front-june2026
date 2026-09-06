import { ArrowRight, BadgeCheck, MapPin, Quote } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseApplyDialog } from "@/features/marketing/components/course-apply-dialog";
import {
  geoContent,
  type GeoCoursePage,
} from "@/features/marketing/lib/geo-course-pages";

/** A consented, country-attributed review. Empty until SEO-09 lands. */
export interface GeoTestimonial {
  name: string;
  role?: string;
  quote: string;
  rating?: number;
}

/**
 * Renders one country landing page.
 *
 * Everything visible here comes from that country's own content file plus the
 * course's stored price — there is no shared body copy to swap a place name
 * into, which is the whole point (see `geo-course-pages.ts`).
 */
export function GeoCourseLanding({
  page,
  locale,
  courseId,
  courseTitle,
  listPrice,
  salePrice,
  testimonials,
  webhookUrl,
}: {
  page: GeoCoursePage;
  locale: string;
  courseId: string;
  courseTitle: string;
  listPrice: number;
  salePrice: number;
  testimonials: GeoTestimonial[];
  webhookUrl?: string;
}) {
  const c = geoContent(page, locale);
  const ar = locale === "ar";

  const onSale = salePrice > 0 && salePrice < listPrice;
  const shown = onSale ? salePrice : listPrice;
  /*
   * Formatted in the page's own currency, not the visitor's. A page whose whole
   * argument is "here is what this costs in Egypt" must not swap the number to
   * USD because the reader happens to be abroad — and unlike the geo-swapping
   * price on the course page, this renders server-side, so a crawler sees it.
   */
  const price = formatCurrency(shown, page.currency);
  const wasPrice = onSale ? formatCurrency(listPrice, page.currency) : "";

  /** Country content may reference the live price with a `{price}` token. */
  const withPrice = (text: string) => text.replaceAll("{price}", price);

  const applyButton = (
    <Button size="lg" className="px-8">
      {ar ? "قدّم الآن" : "Apply now"}
    </Button>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header>
        <Badge variant="secondary" className="mb-3 inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {c.countryName}
        </Badge>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-balance sm:text-[2.6rem]">
          {c.h1}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{withPrice(c.intro)}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {ar ? `سعر الكورس في ${c.countryName}` : `Course fee in ${c.countryName}`}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-heading text-3xl font-bold tabular-nums">{price}</span>
              {wasPrice && (
                <span className="text-sm text-muted-foreground line-through tabular-nums">{wasPrice}</span>
              )}
            </p>
          </div>
          <div className="ms-auto">
            <CourseApplyDialog
              courseId={courseId}
              courseTitle={courseTitle}
              webhookUrl={webhookUrl}
              trigger={applyButton}
            />
          </div>
        </div>
      </header>

      <div className="mt-10 space-y-10">
        {c.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-2xl font-bold tracking-tight">{section.heading}</h2>
            <div className="mt-3 space-y-4">
              {section.paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed text-foreground/90">
                  {withPrice(p)}
                </p>
              ))}
            </div>
          </section>
        ))}

        {/*
          Testimonials render only when real, consented reviews from this
          country exist. There is no sample fallback and there must never be
          one — inventing a named student is the failure mode this whole page
          is built to avoid.
        */}
        {testimonials.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {ar ? `آراء دارسين من ${c.countryName}` : `From students in ${c.countryName}`}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {testimonials.map((t) => (
                <figure key={`${t.name}-${t.quote.slice(0, 24)}`} className="rounded-2xl border border-border/70 bg-card p-5">
                  <Quote className="size-5 text-primary/50" />
                  <blockquote className="mt-2 text-sm leading-relaxed text-foreground/90">{t.quote}</blockquote>
                  <figcaption className="mt-3 text-sm font-semibold">
                    {t.name}
                    {t.role && <span className="block text-xs font-normal text-muted-foreground">{t.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {ar ? `أسئلة شائعة من ${c.countryName}` : `Questions we get from ${c.countryName}`}
          </h2>
          <dl className="mt-4 space-y-4">
            {c.faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-border/70 bg-card p-5">
                <dt className="flex items-start gap-2 font-semibold">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f.q}
                </dt>
                <dd className="mt-2 ps-6 text-sm leading-relaxed text-muted-foreground">{withPrice(f.a)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl bg-gradient-to-br from-primary/[0.09] via-primary/[0.03] to-transparent p-6 ring-1 ring-primary/10 sm:p-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{c.ctaHeading}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{withPrice(c.ctaBody)}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CourseApplyDialog
              courseId={courseId}
              courseTitle={courseTitle}
              webhookUrl={webhookUrl}
              trigger={applyButton}
            />
            <Link
              href={`/courses/${page.courseSlug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all"
            >
              {ar ? "تفاصيل الكورس الكاملة" : "Full course details"}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
