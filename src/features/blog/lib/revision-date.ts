/**
 * When an article was genuinely last revised — or `undefined` when we cannot
 * honestly say.
 *
 * `updatedAt` was not a content-modification date. The public read endpoint
 * counted a view with `findOneAndUpdate`, and Mongoose schema timestamps turned
 * every one of those writes into a touch of `updatedAt`. Two reads two seconds
 * apart moved it. So all 48 articles claimed to have been modified minutes ago,
 * and the site published that claim in three places: `dateModified` in the
 * article's structured data, the visible "last updated" line, and `lastmod` for
 * every blog URL in the sitemap.
 *
 * The cause is fixed in the backend (`blog.service.ts` now passes
 * `timestamps: false` when incrementing views), but the *stored* values are
 * already polluted — every post currently reads as "updated today" regardless
 * of when it was actually written. Nothing in the data distinguishes a polluted
 * timestamp from a genuine recent edit, so until the stored values are
 * corrected there is no honest revision date to publish, and we publish none.
 *
 * ── Both remediation steps are done (2026-09-08) ───────────────────────────
 *   1. Backend fix deployed — `blog.service.ts` passes `timestamps: false` when
 *      incrementing views. Confirmed over two days of live traffic: not one
 *      `updatedAt` moved, where previously every read moved one.
 *   2. Backfilled — `updatedAt = publishedAt` on all 48 posts, resetting the
 *      baseline to something true.
 * So an unedited post now has `updatedAt == publishedAt` and reports no
 * revision date, while a genuinely edited one reports the date it was edited,
 * which is what every consumer of this field always assumed it meant.
 */
export const REVISION_DATES_TRUSTWORTHY = true;

/** A revision counts only if it landed at least this long after publication. */
const MIN_GAP_MS = 24 * 60 * 60 * 1000;

/**
 * The article's real revision timestamp, or undefined when there isn't one.
 *
 * Undefined is the right answer for an article that was published and never
 * touched again — `dateModified` should simply be absent, not a copy of
 * `datePublished` dressed up as an edit.
 */
export function revisionDate(publishedAt?: string, updatedAt?: string): string | undefined {
  if (!REVISION_DATES_TRUSTWORTHY) return undefined;
  if (!publishedAt || !updatedAt) return undefined;
  const published = new Date(publishedAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(published) || Number.isNaN(updated)) return undefined;
  return updated > published + MIN_GAP_MS ? updatedAt : undefined;
}
