import { CalendarDays, Clock, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";

export interface KnowledgeArticle {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  readingMinutes?: number;
  publishedAt?: string;
}

/**
 * Supporting articles for one course, resolved from the blog by reverse lookup
 * on `relatedCourseSlugs`.
 *
 * Internal linking ran one way only: articles pointed at courses and nothing
 * pointed back, so the topical cluster had no hub. This is the hub half — the
 * course page linking out to the articles that support it.
 *
 * Anchor text is the article title, which is correct in this direction: each
 * target is linked once, so there is no repeated-anchor footprint to avoid.
 */
export function CourseKnowledgeArticles({
  articles,
  locale,
  courseTitle,
}: {
  articles: KnowledgeArticle[];
  locale: string;
  courseTitle: string;
}) {
  if (articles.length === 0) return null;
  const ar = locale === "ar";

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(ar ? "ar-EG" : "en", { month: "short", year: "numeric" }) : "";

  return (
    <section id="articles" className="scroll-mt-32" aria-labelledby="course-articles-heading">
      <h2 id="course-articles-heading" className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {ar ? "اقرأ أكثر حول هذا المجال" : "Read more on this subject"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {ar
          ? `مقالات من فريق IMETS تشرح الموضوعات التي يغطيها ${courseTitle}.`
          : `Articles from the IMETS team on the topics ${courseTitle} covers.`}
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/blog/${a.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              {a.category && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{a.category}</span>
              )}
              <span className="mt-1.5 block font-heading font-semibold leading-snug text-foreground group-hover:text-primary">
                {a.title}
              </span>
              {a.excerpt && (
                <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</span>
              )}
              <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {a.publishedAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {fmt(a.publishedAt)}
                  </span>
                )}
                {!!a.readingMinutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {a.readingMinutes} {ar ? "دقيقة" : "min"}
                  </span>
                )}
                <ArrowRight className="ms-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
