import type { BlogPost } from "@/types/blog";

/**
 * Sibling articles for one post.
 *
 * Linking on this blog ran one way. SEO-06 wired articles down to their course
 * pages and course pages back up to their articles, but nothing connected the
 * articles to each other: the marketing guide had zero outbound article links,
 * "CBAHI vs JCI" had one, and the CPHQ pillar — the best-linked of the 48 — had
 * four, against twelve on a single course page. Forty-eight pages of genuine
 * topical authority with no path between them.
 *
 * Relatedness is scored from stored fields, never guessed:
 *
 *   +3  each course the two articles both support — the strongest signal there
 *       is, because it means an editor put them in the same cluster
 *   +2  same category
 *   +1  each shared tag
 *
 * A post with no signal scores zero and is not linked. Padding the block with
 * whatever is newest would produce links that describe nothing, which is the
 * kind of internal linking Google discounts and readers ignore.
 */

/** Weights, named so the scoring reads as its own explanation. */
const SAME_COURSE = 3;
const SAME_CATEGORY = 2;
const SHARED_TAG = 1;

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  readingMinutes?: number;
  publishedAt?: string;
}

function overlap(a: string[] | undefined, b: string[] | undefined): number {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => set.has(x.toLowerCase())).length;
}

export function relatedPosts(
  current: BlogPost,
  all: BlogPost[],
  limit = 5,
): RelatedPost[] {
  const currentLocale = current.language === "ar" ? "ar" : "en";

  const scored = all
    .filter(
      (p) =>
        p.slug !== current.slug &&
        // Never link across locales: an Arabic reader sent to an English
        // article is a worse outcome than no link.
        (p.language === "ar" ? "ar" : "en") === currentLocale,
    )
    .map((p) => {
      let score = 0;
      score += SAME_COURSE * overlap(p.relatedCourseSlugs, current.relatedCourseSlugs);
      if (p.category && current.category && p.category === current.category) {
        score += SAME_CATEGORY;
      }
      score += SHARED_TAG * overlap(p.tags, current.tags);
      return { post: p, score };
    })
    .filter((x) => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        // Equal relevance ⇒ prefer the more recent article.
        (b.post.publishedAt ?? "").localeCompare(a.post.publishedAt ?? ""),
    )
    .slice(0, limit);

  return scored.map(({ post }) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    readingMinutes: post.readingMinutes,
    publishedAt: post.publishedAt,
  }));
}
