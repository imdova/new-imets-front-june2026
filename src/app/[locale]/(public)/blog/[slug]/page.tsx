import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ChevronRight, ArrowRight } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_URL, SITE_NAME, localeUrl, metaDescription, breadcrumbLd, personRef, ORGANIZATION_ID,
} from "@/lib/seo";
import { ArticleSections, ArticleContent, headingId } from "@/features/blog/components/article-sections";
import { ReadingProgress, ArticleToc } from "@/features/blog/components/article-reader-ui";
import { CourseCallout } from "@/features/blog/components/course-callout";
import { ArticleByline, type ArticleAuthor } from "@/features/blog/components/article-byline";
import { courseAnchorText } from "@/features/blog/lib/course-anchors";
import { splitAtSecondHeading } from "@/features/blog/lib/split-sections";
import { revisionDate } from "@/features/blog/lib/revision-date";
import { relatedPosts } from "@/features/blog/lib/related-posts";
import { RelatedArticles } from "@/features/blog/components/related-articles";

// Memoize per request so generateMetadata + the page share one fetch
// (the backend increments `views` on read — we want exactly one increment).
const getArticle = cache((slug: string) => dal.blog.fetchArticleBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  // `locale` is deliberately unused: an article's metadata is the same on
  // /blog/<slug> and /ar/blog/<slug>, because the canonical below points both
  // at the locale the article is actually written in.
  const { slug } = await params;
  const res = await getArticle(slug);
  if (!res.ok) return {};
  const post = res.data;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || metaDescription(post.excerpt, title);
  const ogImage = post.coverImageUrl || `${SITE_URL}/blog/${post.slug}/og`;

  /*
   * Blog routes emitted a bare self-canonical and no hreflang at all, unlike
   * every course and category route.
   *
   * The naive fix — copy `seoAlternates` and emit en/ar/x-default — would be
   * wrong here. Course pages genuinely exist in both locales; articles do not.
   * All 48 are `language: "en"`, and `/ar/blog/<slug>` serves that same English
   * text. Declaring an `ar` alternate would advertise a translation that does
   * not exist, and Google would find the English article again.
   *
   * So the article's own language decides: the canonical always points at the
   * URL for the locale the article is actually written in, which makes
   * `/ar/blog/<slug>` consolidate into `/blog/<slug>` instead of competing with
   * it as a duplicate. `languages` lists only locales the article exists in —
   * one entry today, and automatically two once a translated post is stored.
   */
  const postLocale = post.language === "ar" ? "ar" : "en";
  const canonical = localeUrl(`/blog/${post.slug}`, postLocale);
  const url = canonical;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        [postLocale]: canonical,
        "x-default": canonical,
      },
    },
    openGraph: { type: "article", title, description, url, images: [ogImage], publishedTime: post.publishedAt },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const res = await getArticle(slug);
  if (!res.ok || !res.data) notFound();
  const post = res.data;

  /*
   * Resolve the post's author to a real faculty member with a profile page.
   *
   * The instructor lookup is the public source — it is what `/instructors/...`
   * renders from, so anything resolved here is guaranteed to have a page to
   * link to. Nothing resolves today: there are no instructor records, and no
   * post carries an `authorId`. The byline then attributes the school, exactly
   * as it does now, and no Person is invented to fill the gap.
   */
  const instructorsRes = await dal.lookups.fetchInstructors();
  const instructor = post.authorId
    ? (instructorsRes.ok ? instructorsRes.data : []).find((i) => i.id === post.authorId)
    : undefined;
  const author: ArticleAuthor | null = instructor
    ? {
        name: instructor.label,
        credentials: instructor.title,
        avatarUrl: instructor.avatarUrl,
        profilePath: `/instructors/${instructor.slug || instructor.id}`,
      }
    : null;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl || `${SITE_URL}/blog/${post.slug}/og`,
    datePublished: post.publishedAt,
    /*
     * `dateModified` is "most recently modified", and for an article published
     * and never touched again that is its publication date — so this emits the
     * stored value rather than omitting the field. That only became honest once
     * `updatedAt` stopped being bumped by page views and the 48 posts were
     * backfilled; see `revision-date.ts` for that history.
     *
     * The *visible* "last updated" line stays gated behind `revisionDate()`:
     * structured data wants the true timestamp, but telling a reader a page was
     * updated on the day it was published is noise.
     */
    dateModified: post.updatedAt || post.publishedAt,
    inLanguage: post.language || locale,
    keywords: post.tags?.length ? post.tags.join(", ") : undefined,
    articleSection: post.category || undefined,
    /*
     * A named, credentialed author is a real quality signal on health content,
     * so when one resolves we point at their Person node by id rather than
     * inlining a copy — the same entity is then referenced from their profile
     * page and from any course they teach.
     *
     * With no author record we attribute the school, which is accurate and is
     * what the site does today. A `Person` here with the organisation's name in
     * it would be a fabricated human being, which on YMYL content is the single
     * worst thing this page could claim.
     */
    author: author
      ? personRef(localeUrl(author.profilePath!, locale))
      // The school itself: reference the organization node the layout already
      // emits rather than inlining a second Organization with the same name,
      // which would split one entity into two in the graph.
      : !post.authorName || post.authorName === SITE_NAME
        ? { "@id": ORGANIZATION_ID }
        : { "@type": "Organization", name: post.authorName },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: localeUrl(`/blog/${post.slug}`, locale),
  };

  // GEO/SEO: surface every FAQ block as FAQPage structured data so search and
  // AI answer engines can cite the Q&A directly.
  const faqs = (post.sections ?? [])
    .flatMap((s) => s.cols)
    .flatMap((c) => c.blocks)
    .filter((b) => b.type === "faq")
    .flatMap((b) => b.faqs ?? []);
  const faqLd = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const crumb = breadcrumbLd([
    { name: locale === "ar" ? "الرئيسية" : "Home", url: localeUrl("/", locale) },
    { name: locale === "ar" ? "المدونة" : "Blog", url: localeUrl("/blog", locale) },
    { name: post.title, url: localeUrl(`/blog/${post.slug}`, locale) },
  ]);

  // Curated (editor-picked) course links. One list fetch, then filtered — the
  // list call is already public + ISR'd, so this costs no extra round-trip per slug.
  const picked = post.relatedCourseSlugs ?? [];
  const coursesRes = picked.length ? await dal.courses.fetchCourses({ status: "published" }) : null;
  const related = picked
    .map((slug) => coursesRes?.ok ? coursesRes.data.find((c) => c.slug === slug) : undefined)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  /*
   * The primary course gets an in-body callout instead of a card at the very
   * bottom; the rest stay in the "Related courses" list. Splitting them this way
   * means no course is linked twice from one article, so the varied anchor in
   * the callout is the anchor for that target rather than being shadowed by a
   * second exact-match title link further down.
   */
  const [primaryCourse, ...secondaryCourses] = related;

  /*
   * Sibling articles. One list fetch, already public + ISR-cached and shared
   * with the course pages, so this costs no extra round-trip per slug.
   */
  const allPostsRes = await dal.blog.fetchPublicArticles({ limit: 200 });
  const siblings = relatedPosts(post, allPostsRes.ok ? allPostsRes.data.data : []);

  /*
   * Insert the callout after the first major section. A link parked under the
   * tag list reads as boilerplate to both readers and crawlers; one placed
   * after the reader has finished the opening argument is contextual. An
   * article too short or too oddly laid out to have a natural break falls back
   * to rendering it after the body — still inside the article, still above the
   * tags.
   */
  const sections = post.sections ?? [];
  const split = splitAtSecondHeading(sections);
  const sectionsBefore = split?.before ?? sections;
  const sectionsAfter = split?.after ?? [];

  // Table of contents from the article's H2s (ids match the renderer's slug).
  const tocItems = (post.sections ?? [])
    .flatMap((s) => s.cols)
    .flatMap((c) => c.blocks)
    .filter((b) => b.type === "heading" && b.level === 2 && !!b.text)
    .map((b) => ({ id: headingId(b.text as string), text: b.text as string }))
    .filter((t) => t.text.toLowerCase() !== "frequently asked questions");

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <ReadingProgress targetId="article-body" />
      <JsonLd data={[articleLd, ...(faqLd ? [faqLd] : []), crumb]} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <Link href="/blog" className="hover:text-foreground">{locale === "ar" ? "المدونة" : "Blog"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span className="line-clamp-1 text-foreground">{post.title}</span>
      </nav>

      {/* Hero header */}
      <header className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/[0.09] via-primary/[0.03] to-transparent p-6 ring-1 ring-primary/10 sm:p-9">
        {post.category && (
          <Badge variant="secondary" className="mb-3">{post.category}</Badge>
        )}
        <h1 className="font-heading text-3xl font-bold leading-[1.15] tracking-tight text-balance sm:text-[2.6rem]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-5">
          <ArticleByline
            author={author}
            organisationName={post.authorName || SITE_NAME}
            publishedAt={post.publishedAt}
            updatedAt={revisionDate(post.publishedAt, post.updatedAt)}
            readingMinutes={post.readingMinutes}
            locale={locale}
          />
        </div>
      </header>

      {post.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-3xl bg-muted">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Body + table-of-contents rail */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
        <div id="article-body" className="min-w-0">
          {sections.length > 0 ? (
            <>
              <ArticleSections sections={sectionsBefore} />
              {primaryCourse && (
                <CourseCallout course={primaryCourse} postSlug={post.slug} locale={locale} />
              )}
              {sectionsAfter.length > 0 && <ArticleSections sections={sectionsAfter} />}
            </>
          ) : (
            <>
              <ArticleContent html={post.content} />
              {primaryCourse && (
                <CourseCallout course={primaryCourse} postSlug={post.slug} locale={locale} />
              )}
            </>
          )}

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border/60 pt-6">
              {post.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
          )}
        </div>

        <aside className="order-first lg:order-none">
          <ArticleToc items={tocItems} label={locale === "ar" ? "على هذه الصفحة" : "On this page"} />
        </aside>
      </div>

      {/* Secondary course links. The primary course is linked in-body above, so
          nothing is linked twice from one article. */}
      {secondaryCourses.length > 0 && (
        <section className="mt-10 border-t border-border/60 pt-8">
          <h2 className="font-heading text-xl font-semibold">
            {locale === "ar" ? "برامج ذات صلة" : "Related courses"}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {secondaryCourses.map((c) => {
              const title = courseAnchorText(c, post.slug, locale);
              return (
                <li key={c.slug}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-foreground group-hover:text-primary">
                        {title}
                      </span>
                      {c.category && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">{c.category}</span>
                      )}
                    </span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <RelatedArticles posts={siblings} locale={locale} />
    </article>
  );
}
