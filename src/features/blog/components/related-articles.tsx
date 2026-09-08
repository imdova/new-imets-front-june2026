import { ArrowRight, Clock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { RelatedPost } from "@/features/blog/lib/related-posts";

/**
 * "Continue reading" — the article-to-article links this blog had almost none
 * of. See `related-posts.ts` for how the list is chosen.
 *
 * The article title is the anchor, which is right in this direction: each
 * target is linked once per page, so there is no repeated-anchor pattern to
 * vary away from (unlike the article→course links, which all pointed at ten
 * pages and needed rotation).
 */
export function RelatedArticles({
  posts,
  locale,
}: {
  posts: RelatedPost[];
  locale: string;
}) {
  if (posts.length === 0) return null;
  const ar = locale === "ar";

  return (
    <section aria-labelledby="related-articles-heading" className="mt-10 border-t border-border/60 pt-8">
      <h2 id="related-articles-heading" className="font-heading text-xl font-semibold">
        {ar ? "اقرأ أيضًا" : "Continue reading"}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group flex h-full flex-col rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              {p.category && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {p.category}
                </span>
              )}
              <span className="mt-1 block font-semibold leading-snug text-foreground group-hover:text-primary">
                {p.title}
              </span>
              {p.excerpt && (
                <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {p.excerpt}
                </span>
              )}
              <span className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                {!!p.readingMinutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {p.readingMinutes} {ar ? "دقيقة" : "min"}
                  </span>
                )}
                <ArrowRight className="ms-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
