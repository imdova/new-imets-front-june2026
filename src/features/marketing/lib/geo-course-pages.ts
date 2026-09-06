import egypt from "../content/geo/egypt.json";

/**
 * Country landing pages for a course (`/cphq-course/egypt`).
 *
 * These exist to compete for "cphq course egypt" and its siblings, which the
 * generic course page ranks for only weakly. The obvious way to build them —
 * one template, swap the country name in the H1 — is a doorway page under
 * Google's spam policies, and shipping three of those is worse than shipping
 * none. So the content is data, not a template: every country supplies its own
 * prose, and a country with nothing specific to say does not get a page.
 *
 * That rule is enforced, not just documented. `scripts/check-geo-content.mjs`
 * runs on `prebuild` and fails the build if any country drops under 600 words
 * per locale, or if two countries' pages are more similar than the threshold.
 *
 * Adding a country: write `content/geo/<country>.json`, register it below, and
 * run `npm run check:geo`. Prices are NOT written into the JSON — `{price}` is
 * substituted at render from the course's stored offer in that currency, so a
 * price change in the admin never leaves a stale number on a landing page.
 */

export interface GeoSection {
  heading: string;
  paragraphs: string[];
}

export interface GeoLocaleContent {
  countryName: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: GeoSection[];
  faqs: { q: string; a: string }[];
  ctaHeading: string;
  ctaBody: string;
}

export interface GeoCoursePage {
  /** URL segment, e.g. "egypt". */
  country: string;
  /** ISO-3166 alpha-2, for `areaServed` in structured data. */
  countryCode: string;
  /** Currency the page quotes in — must be one the course actually prices in. */
  currency: "EGP" | "SAR" | "USD";
  /** The course this page sells. */
  courseSlug: string;
  en: GeoLocaleContent;
  ar: GeoLocaleContent;
}

/*
 * Saudi Arabia and the UAE are deliberately absent.
 *
 * SEO-08 says to ship Egypt, measure for 30 days, then decide — and not to
 * create a market's page without 600 unique, useful words for it. Registering
 * an empty entry here would produce a live URL, so the list stays at one until
 * that content is actually written.
 */
const PAGES: GeoCoursePage[] = [egypt as GeoCoursePage];

/** Every country page that exists. */
export function listGeoCoursePages(): GeoCoursePage[] {
  return PAGES;
}

/** One country page, or undefined — the route 404s on undefined. */
export function getGeoCoursePage(country: string): GeoCoursePage | undefined {
  return PAGES.find((p) => p.country === country.toLowerCase());
}

/** The country pages for one course, used to link them from the course page. */
export function geoCoursePagesFor(courseSlug: string): GeoCoursePage[] {
  return PAGES.filter((p) => p.courseSlug === courseSlug);
}

/**
 * Locale-independent path for a country page.
 *
 * The `/cphq-course` segment is the route directory name, so it is fixed here
 * rather than derived from `courseSlug`. A second course wanting geo pages
 * needs its own route folder — and a matching branch in this function.
 */
export function geoCoursePath(page: GeoCoursePage): string {
  return `/cphq-course/${page.country}`;
}

/** Pick the content for the active locale. */
export function geoContent(page: GeoCoursePage, locale: string): GeoLocaleContent {
  return locale === "ar" ? page.ar : page.en;
}
