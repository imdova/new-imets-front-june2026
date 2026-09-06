import { dal } from "@/lib/dal";
import { localeUrl } from "@/lib/seo";
import { listGeoCoursePages, geoCoursePath } from "@/features/marketing/lib/geo-course-pages";
import { revisionDate } from "@/features/blog/lib/revision-date";

/**
 * Shared sitemap data + XML serialisation.
 *
 * The site previously shipped one flat file of 80 English URLs. Every `/ar/`
 * page — including fully translated course pages — was absent, so Google's only
 * route to the Arabic site was the hreflang tag on the English page. That is a
 * weak discovery path, and it left the least contested market invisible by
 * omission.
 *
 * Now there is an index at `/sitemap.xml` pointing at four children:
 * `sitemap-pages`, `sitemap-courses`, `sitemap-blog` and `sitemap-ar`. Every
 * entry declares its counterpart via `xhtml:link` (en / ar / x-default).
 *
 * Splitting the Arabic URLs into their own file — rather than duplicating both
 * locales into each content file — keeps URLs unique across the index and makes
 * "how much Arabic is actually indexed" directly readable in Search Console's
 * per-sitemap report, which is the number this work exists to move.
 *
 * NOTE: these are plain route handlers, not Next's `sitemap.ts` metadata
 * convention. That convention reserves `/sitemap.xml`, and with
 * `generateSitemaps()` it serves ONLY the children at `/sitemap/<id>.xml` while
 * `/sitemap.xml` itself 404s — verified against a production build. A 404 there
 * would break `robots.txt` and drop every URL already submitted.
 */

/** Public, indexable static routes (locale-agnostic paths). */
const STATIC_PATHS = [
  "/",
  "/courses",
  "/free-courses",
  "/instructors",
  "/about",
  "/become-instructor",
  "/contact",
  "/help",
  "/blog",
  "/careers",
  "/privacy",
  "/terms",
  "/success-stories",
];

export type SitemapLocale = "en" | "ar";

/**
 * A path, the real timestamp of the content behind it, and the locales it
 * actually exists in.
 *
 * `locales` defaults to both. It matters for the blog: all 48 articles are
 * English, but every one was being submitted twice — `/blog/x` and
 * `/ar/blog/x` — serving byte-identical English content while the hreflang tag
 * claimed one of them was Arabic. That is 48 self-inflicted duplicate titles
 * (the site-wide audit counted 50 in total, and 48 of them were this), and it
 * asks Google to index a translation that does not exist.
 */
export type SitemapRow = {
  path: string;
  lastModified?: Date;
  locales?: SitemapLocale[];
};

const BOTH_LOCALES: SitemapLocale[] = ["en", "ar"];

/** Parse an API timestamp, discarding anything unusable. */
function realDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Newest of a set of dates — for index pages that summarise other content. */
function newest(dates: (Date | undefined)[]): Date | undefined {
  const valid = dates.filter((d): d is Date => !!d);
  return valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : undefined;
}

/** Every indexable path, grouped the way the sitemap index splits them. */
export async function collectSitemapRows(): Promise<{
  pages: SitemapRow[];
  courses: SitemapRow[];
  blog: SitemapRow[];
}> {
  const [coursesRes, catsRes, instRes, blogRes, blogCatsRes] = await Promise.all([
    dal.courses.fetchCourses().catch(() => null),
    dal.lookups.fetchCategories().catch(() => null),
    dal.lookups.fetchInstructors().catch(() => null),
    dal.blog.fetchPublicArticles({ limit: 1000 }).catch(() => null),
    dal.blog.fetchTopics().catch(() => null),
  ]);

  const courses: SitemapRow[] = [];
  const publishedSlugs = new Set<string>();
  if (coursesRes?.ok) {
    for (const c of coursesRes.data) {
      if (c.status !== "published" || !c.slug) continue;
      publishedSlugs.add(c.slug);
      courses.push({ path: `/courses/${c.slug}`, lastModified: realDate(c.updatedAt) });
    }
  }

  /*
   * Country landing pages (`/cphq-course/egypt`). They sit with the courses
   * rather than the marketing pages because that is what they are — a course
   * page for one market. Both locales are emitted by `urlsetXml`, so the
   * Arabic version is submitted too. No `lastModified`: the content lives in a
   * checked-in JSON file with no publish timestamp, and inventing one would put
   * a meaningless date in front of a crawler. A page whose course is no longer
   * published is skipped, matching what the route itself does.
   */
  for (const geo of listGeoCoursePages()) {
    if (!publishedSlugs.has(geo.courseSlug)) continue;
    courses.push({ path: geoCoursePath(geo) });
  }

  // The public list returns only PUBLISHED articles.
  const blog: SitemapRow[] = [];
  if (blogRes?.ok) {
    for (const post of blogRes.data.data) {
      if (!post.slug) continue;
      // `updatedAt` is not a revision date (see `features/blog/lib/revision-date.ts`),
      // so a post that was never edited ships its publication date instead of
      // telling the crawler it changed today.
      blog.push({
        path: `/blog/${post.slug}`,
        lastModified: realDate(revisionDate(post.publishedAt, post.updatedAt) ?? post.publishedAt),
        // Only the locale the article is actually written in.
        locales: [(post.language === "ar" ? "ar" : "en") as SitemapLocale],
      });
    }
  }

  /*
   * Index pages inherit the freshest timestamp of what they list — a real
   * signal, unlike stamping them with "now". Marketing pages and taxonomy have
   * no timestamp available, so they ship without one: a sitemap where every URL
   * changed today tells a crawler nothing and gets discounted.
   */
  const freshestCourse = newest(courses.map((r) => r.lastModified));
  const freshestPost = newest(blog.map((r) => r.lastModified));
  const derived: Record<string, Date | undefined> = {
    "/": newest([freshestCourse, freshestPost]),
    "/courses": freshestCourse,
    "/blog": freshestPost,
  };

  const pages: SitemapRow[] = STATIC_PATHS.map((path) => ({
    path,
    lastModified: derived[path],
  }));

  if (catsRes?.ok) for (const c of catsRes.data) pages.push({ path: `/category/${c.slug || c.id}` });
  if (instRes?.ok) for (const i of instRes.data) pages.push({ path: `/instructors/${i.slug || i.id}` });
  if (blogCatsRes?.ok) for (const c of blogCatsRes.data) if (c.slug) pages.push({ path: `/blog/category/${c.slug}` });

  /*
   * Free-lecture detail pages are deliberately absent. They are noindexed (lead
   * capture, not search assets) and several duplicate the H1 of a paid course
   * page — submitting a noindexed URL only asks Google to crawl something it is
   * then told to drop. The `/free-courses` index above stays.
   */
  return { pages, courses, blog };
}

/** XML-escape a URL or text node. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Serialise rows into a urlset for one locale, with hreflang alternates on every
 * entry pointing at both locales plus `x-default`.
 */
export function urlsetXml(rows: SitemapRow[], locale: SitemapLocale): string {
  const urls = rows
    // A row is absent from a locale's file when the content does not exist in it.
    .filter((row) => (row.locales ?? BOTH_LOCALES).includes(locale))
    .map((row) => {
      const locales = row.locales ?? BOTH_LOCALES;
      const en = esc(localeUrl(row.path, "en"));
      const ar = esc(localeUrl(row.path, "ar"));
      const self = locale === "ar" ? ar : en;
      /*
       * Alternates only for locales that exist. Declaring an `ar` alternate for
       * an English-only article tells Google there is a translation to index,
       * and what it finds there is the English text over again.
       */
      const alternates =
        (locales.includes("en") ? `    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>\n` : "") +
        (locales.includes("ar") ? `    <xhtml:link rel="alternate" hreflang="ar" href="${ar}"/>\n` : "") +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${locales.includes("en") ? en : ar}"/>\n`;
      return (
        `  <url>\n` +
        `    <loc>${self}</loc>\n` +
        (row.lastModified ? `    <lastmod>${row.lastModified.toISOString()}</lastmod>\n` : "") +
        alternates +
        `  </url>\n`
      );
    })
    .join("");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` +
    ` xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls +
    `</urlset>\n`
  );
}

/** Standard response wrapper for a sitemap document. */
export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Re-generated hourly at the edge; crawlers are not latency-sensitive.
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
