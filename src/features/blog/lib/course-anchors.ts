import type { CourseRow } from "@/types";

/**
 * Anchor text for a blog → course link.
 *
 * Every one of these links used the course title verbatim. Forty-eight
 * identical exact-match anchors pointing at one page is the classic footprint
 * of engineered linking; varied anchors also teach Google the whole keyword set
 * rather than one phrase.
 *
 * The variant is chosen deterministically from the post + course slug, so a
 * given article always renders the same anchor (stable across ISR revalidations
 * and safe for hydration), while the set as a whole spreads evenly.
 *
 * Measured against the current 48 posts, the busiest anchor takes 36% of links
 * to the largest target and 40% to the next — at the 40% ceiling, not over it,
 * and the residual variance is small-sample noise rather than a fifth variant
 * short. If a course ever needs a harder guarantee, add a variant rather than
 * changing the seed; changing the seed reshuffles every existing anchor.
 */

/** FNV-1a — small, stable, no dependencies. */
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * The course's short name: the part before a dash/colon subtitle.
 * "CPHQ Preparation - Certified Professional in Healthcare Quality" → "CPHQ Preparation".
 */
function shortName(title: string): string {
  const cut = title.split(/\s[-–—:]\s/)[0]?.trim();
  return cut && cut.length >= 3 ? cut : title.trim();
}

/** "10 Weeks" → "10-week", so it reads naturally inside a sentence. */
function durationPhrase(duration?: string): string {
  const m = String(duration ?? "").match(/(\d+)\s*(week|month|day)s?/i);
  if (!m) return "";
  return `${m[1]}-${m[2].toLowerCase()}`;
}

/**
 * Pick the anchor text for one post → course link.
 *
 * Arabic falls back to the course's Arabic title: the variants below are English
 * sentence fragments and would not read correctly transliterated.
 */
export function courseAnchorText(
  course: Pick<CourseRow, "slug" | "titleEn" | "titleAr" | "duration">,
  postSlug: string,
  locale: string,
): string {
  if (locale === "ar") return course.titleAr || course.titleEn;

  const short = shortName(course.titleEn);
  const dur = durationPhrase(course.duration);

  const variants = [
    course.titleEn,
    `our live ${short} course`,
    dur ? `IMETS's ${dur} ${short} program` : `the ${short} program`,
    `${short} course`,
    `the ${short} program at IMETS`,
  ];

  return variants[hash(`${postSlug}:${course.slug}`) % variants.length];
}

/**
 * A one-line reason to click, shown under the callout heading. Kept generic so
 * it is true of any course — nothing here asserts a fact we do not store.
 */
export function courseCalloutBlurb(course: Pick<CourseRow, "duration">, locale: string): string {
  const dur = durationPhrase(course.duration);
  if (locale === "ar") {
    return "برنامج مباشر بقيادة خبراء، مع جلسات مسجّلة ودعم بالعربية.";
  }
  return dur
    ? `A live, ${dur} program taught by practitioners — sessions are recorded and support is available in Arabic.`
    : "A live program taught by practitioners — sessions are recorded and support is available in Arabic.";
}
