import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { staticPageMeta, SITE_NAME } from "@/lib/seo";
import { ArticleCard } from "@/features/blog/components/article-card";

const COLOR_WASH: Record<string, string> = {
  primary: "from-primary/15", info: "from-info/15", success: "from-success/15",
  warning: "from-warning/15", destructive: "from-destructive/15", neutral: "from-muted",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const res = await dal.blog.fetchCategoryLanding(slug);
  /*
   * A transient API failure used to return `{}` here, which ships a page with
   * no title and no description at all — worse than an imperfect one, and
   * invisible until you crawl for it (the site-wide audit caught five such
   * pages in a single pass, all of which title correctly on a retry). Fall back
   * to something derived from the slug instead.
   */
  if (!res.ok) {
    const readable = slug.replace(/-/g, " ").replace(/\w/g, (m) => m.toUpperCase());
    return staticPageMeta({
      title: `${readable} articles`,
      description: `Articles on ${readable.toLowerCase()} from ${SITE_NAME}.`,
      path: `/blog/category/${slug}`,
      locale,
    });
  }
  const c = res.data.category;
  return staticPageMeta({
    title: c.seoTitle || `${c.name} articles`,
    description: c.seoDescription || c.description || `Articles in ${c.name}.`,
    path: `/blog/category/${slug}`,
    locale,
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const res = await dal.blog.fetchCategoryLanding(slug);
  if (!res.ok) notFound();
  const { category, data } = res.data;

  const ar = locale === "ar";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/blog" className="hover:text-foreground">{ar ? "المدونة" : "Blog"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className={`mb-8 overflow-hidden rounded-3xl bg-gradient-to-br to-transparent p-8 ring-1 ring-border/50 sm:p-10 ${COLOR_WASH[category.color] ?? COLOR_WASH.primary}`}>
        <span className="inline-flex items-center rounded-full bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-foreground/70 ring-1 ring-border/50">
          {ar ? "قسم" : "Topic"}
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}
        <p className="mt-4 text-sm font-medium text-foreground/60">
          {data.length} {ar ? "مقالة" : data.length === 1 ? "article" : "articles"}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-border/60 text-sm text-muted-foreground">
          No articles in this category yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => <ArticleCard key={p.id} post={p} featured={p.featured} />)}
        </div>
      )}
    </div>
  );
}
