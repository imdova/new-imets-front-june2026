/**
 * Public SEO metadata resolver — turns the admin-managed SEO settings + per-page
 * overrides into a Next `Metadata` object for `generateMetadata`. Reads the
 * public, cached SEO endpoints; degrades gracefully if the backend is
 * unavailable (returns minimal metadata rather than throwing).
 */
import type { Metadata } from "next";
import * as seoSvc from "@integration/services/seo";

/**
 * A page title, with the brand appearing exactly once.
 *
 * The root layout applies `template: "%s · IMETS Medical School"`, which is
 * right for a title that does not name the school and wrong for one that does.
 * Fourteen pages shipped the brand twice — the homepage read "IMETS Medical
 * School — Advance Your Healthcare Career with Internationally Recognized
 * Programs · IMETS Medical School" at 117 characters, of which barely half
 * survived to the SERP and none of it was a target keyword.
 *
 * Returning `{ absolute }` opts that title out of the template. Applied
 * centrally in `mergeSeo` below, so a new page cannot reintroduce the problem.
 */
export function brandedTitle(title: string): string | { absolute: string } {
  return /IMETS/i.test(title) ? { absolute: title } : title;
}

export async function resolveSeoMetadata(path: string): Promise<Metadata> {
  const [settingsRes, pageRes] = await Promise.all([
    seoSvc.getPublicSettings(),
    seoSvc.getPublicPage(path),
  ]);
  const s = settingsRes.ok ? settingsRes.data : null;
  const p = pageRes.ok ? pageRes.data : null;

  const baseTitle = p?.title || s?.defaultTitle || s?.siteName || "IMETS";
  const title =
    s?.titleTemplate?.includes("%s") && p?.title
      ? s.titleTemplate.replace("%s", p.title)
      : baseTitle;
  const description = p?.description || s?.defaultDescription || "";
  const image = p?.ogImage || s?.defaultOgImage || "";
  const noindex = (s ? !s.indexable : false) || !!p?.noindex;

  const meta: Metadata = {
    title,
    description,
    openGraph: { title, description, ...(image ? { images: [image] } : {}) },
  };
  if (noindex) meta.robots = { index: false, follow: false };
  if (p?.canonical) meta.alternates = { canonical: p.canonical };
  if (s?.twitterHandle) meta.twitter = { card: "summary_large_image", site: s.twitterHandle };
  return meta;
}

/**
 * Merge admin-managed SEO for `path` UNDER a page's own `base` metadata, so the
 * page keeps its (localized) title/description/alternates while inheriting
 * admin-controlled fields it doesn't set — e.g. a site-wide/ per-page noindex,
 * canonical, OG image and twitter handle. Best-effort; never throws.
 */
export async function mergeSeo(path: string, base: Metadata): Promise<Metadata> {
  const admin = await resolveSeoMetadata(path).catch(() => ({} as Metadata));
  const merged: Metadata = {
    ...admin,
    ...base,
    openGraph: { ...admin.openGraph, ...base.openGraph },
  };
  /*
   * Normalise the title here rather than at every call site: the layout's
   * "%s · IMETS Medical School" template is only correct for titles that do not
   * already name the school, and pages that do were shipping the brand twice.
   * A page that has already decided (by passing `{ absolute }`) is left alone.
   */
  if (typeof merged.title === "string") merged.title = brandedTitle(merged.title);
  return merged;
}
