/**
 * SEO helpers — canonical/hreflang alternates and JSON-LD builders.
 *
 * URL model mirrors the i18n routing (`localePrefix: "as-needed"`): English is
 * served at the root, Arabic under `/ar`. `x-default` points at English.
 */
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { mergeSeo } from "@/lib/public-seo";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://imetsedu.com").replace(/\/$/, "");
export const SITE_NAME = "IMETS Medical School";
export const SITE_LOGO = `${SITE_URL}/icon`;

/** Absolute URL for a locale-agnostic public path (leading slash, no locale). */
export function localeUrl(path: string, locale: string): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale
    ? `${SITE_URL}${clean || "/"}`
    : `${SITE_URL}/${locale}${clean}`;
}

/** `alternates` block: self-canonical + hreflang (en / ar / x-default). */
export function seoAlternates(path: string, locale: string): Metadata["alternates"] {
  return {
    canonical: localeUrl(path, locale),
    languages: {
      en: localeUrl(path, "en"),
      ar: localeUrl(path, "ar"),
      "x-default": localeUrl(path, "en"),
    },
  };
}

/** Strip HTML + collapse whitespace + clamp to a meta-description length. */
export function metaDescription(input?: string, fallback = ""): string {
  const text = (input || fallback).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

/** Shared OpenGraph/Twitter block for a public page. When no `image` is given,
 * the file-based default `opengraph-image` is used automatically. */
export function socialMeta(opts: {
  title: string;
  description: string;
  path: string;
  locale: string;
  image?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const images = opts.image ? [opts.image] : undefined;
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: localeUrl(opts.path, opts.locale),
      siteName: SITE_NAME,
      type: "website",
      locale: opts.locale === "ar" ? "ar_EG" : "en_US",
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, ...(images ? { images } : {}) },
  };
}

/** Full metadata block for a static public page (title + description + canonical
 * + hreflang + social), with admin-managed SEO (settings + per-path override)
 * merged underneath so it contributes fields the page doesn't set. */
export async function staticPageMeta(opts: {
  title: string;
  description: string;
  path: string;
  locale: string;
  image?: string;
}): Promise<Metadata> {
  const base: Metadata = {
    title: opts.title,
    description: opts.description,
    alternates: seoAlternates(opts.path, opts.locale),
    ...socialMeta(opts),
  };
  return mergeSeo(opts.path, base);
}

/* ───────────────────────────── JSON-LD ───────────────────────────── */

/**
 * Markets the school actually teaches into. Emitted as `areaServed`, which is
 * how an entity index associates the organization with a region — a `.com` with
 * no country signal in the domain has nothing else to go on.
 */
const AREA_SERVED = [
  "Egypt", "Saudi Arabia", "United Arab Emirates",
  "Qatar", "Kuwait", "Oman", "Jordan",
] as const;

/**
 * The organization node. Contact details, address and social profiles come from
 * Site Settings so nothing here is a placeholder — anything the admin has left
 * blank is omitted from the markup rather than shipped as "[LinkedIn page]".
 */
export function organizationLd(opts?: {
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  social?: { facebook?: string; x?: string; linkedin?: string; instagram?: string; youtube?: string };
}) {
  const sameAs = Object.values(opts?.social ?? {}).filter(
    (u): u is string => typeof u === "string" && /^https?:\/\//i.test(u),
  );
  const contactPoint = opts?.phone || opts?.email
    ? [{
        "@type": "ContactPoint",
        contactType: "admissions",
        ...(opts.phone ? { telephone: opts.phone } : {}),
        ...(opts.email ? { email: opts.email } : {}),
        availableLanguage: ["en", "ar"],
        areaServed: ["EG", "SA", "AE", "QA", "KW", "OM", "JO"],
      }]
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    ...(opts?.description ? { description: opts.description } : {}),
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Country", name })),
    ...(opts?.address
      ? { address: { "@type": "PostalAddress", streetAddress: opts.address, addressCountry: "EG" } }
      : {}),
    ...(contactPoint.length ? { contactPoint } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * `ItemList` of courses for a listing page — the Course List carousel is one of
 * the few course-related rich results Google still renders, and it requires the
 * list to live on a list page rather than on each course.
 */
export function courseListLd(opts: {
  url: string;
  name: string;
  courses: { name: string; url: string; description?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    url: opts.url,
    numberOfItems: opts.courses.length,
    itemListElement: opts.courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.name,
        url: c.url,
        ...(c.description ? { description: c.description } : {}),
        provider: {
          "@type": "EducationalOrganization",
          name: SITE_NAME,
          sameAs: SITE_URL,
        },
      },
    })),
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function personLd(opts: {
  name: string;
  jobTitle?: string;
  image?: string;
  url: string;
  locale: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    ...(opts.jobTitle ? { jobTitle: opts.jobTitle } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    url: opts.url,
    worksFor: { "@type": "EducationalOrganization", name: SITE_NAME, sameAs: SITE_URL },
    inLanguage: opts.locale,
  };
}

/**
 * The `@id` of the EducationalOrganization node emitted once per page by the
 * public layout (`organizationLd`). Other nodes reference it instead of
 * repeating the organization inline, so everything resolves to one entity.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * How long a promotional price is advertised as valid, for `Offer.priceValidUntil`.
 *
 * ⚠️ ROLL THIS when the promotion changes or the year turns. An offer whose
 * `priceValidUntil` is in the past is treated as expired and silently drops out
 * of eligibility — hence `offerPriceValidUntil()` below, which refuses to emit
 * a stale date rather than shipping one.
 */
export const OFFER_PRICE_VALID_UNTIL = "2026-12-31";

/**
 * The advertised end of the current promotion, or `undefined` once it has passed.
 *
 * Omitting the property is strictly better than emitting an expired one: without
 * it the offer stays valid indefinitely, with it the offer is disqualified. If
 * this starts returning `undefined`, the constant above needs rolling.
 */
export function offerPriceValidUntil(): string | undefined {
  const until = new Date(`${OFFER_PRICE_VALID_UNTIL}T23:59:59Z`);
  if (Number.isNaN(until.getTime()) || until.getTime() < Date.now()) return undefined;
  return OFFER_PRICE_VALID_UNTIL;
}

/** One scheduled cohort, as stored on the course record. */
export interface CourseInstanceInput {
  startDate: string;
  endDate: string;
  dayOfWeek?: string;
  sessionTime?: string;
  timezone?: string;
  weeklyHours?: number;
  sessionDurationMinutes?: number;
  seatsAvailable?: number;
  status?: "open" | "closed" | "full";
}

/**
 * A human duration string ("8 weeks", "3 أشهر", "40 hours") → ISO-8601, for
 * `timeRequired`. Returns undefined when nothing parseable is there, so the
 * property is omitted rather than emitted wrong.
 */
export function isoWeeks(duration?: string): string | undefined {
  const s = String(duration ?? "").trim();
  if (!s) return undefined;
  const n = Number(s.match(/\d+(\.\d+)?/)?.[0]);
  if (!n || n <= 0) return undefined;
  if (/week|أسبوع|اسبوع/i.test(s)) return `P${Math.round(n)}W`;
  if (/month|شهر|أشهر/i.test(s)) return `P${Math.round(n)}M`;
  if (/day|يوم|أيام/i.test(s)) return `P${Math.round(n)}D`;
  if (/hour|ساع/i.test(s)) return `PT${Math.round(n)}H`;
  return undefined;
}

/** Decimal hours → an ISO-8601 duration ("PT2H30M"). */
function isoDuration(hours: number): string | undefined {
  if (!hours || hours <= 0) return undefined;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}` === "PT" ? undefined : `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

/** Minutes → ISO-8601 duration. */
function isoMinutes(min: number): string | undefined {
  if (!min || min <= 0) return undefined;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

export function courseLd(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  locale: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  /** Real, admin-entered, CONSENTED reviews only. Never sample or generated
   *  ones — marking up invented reviews is a review-snippet policy violation. */
  reviews?: { author: string; rating: number; body: string; datePublished?: string }[];
  /* ── Everything below comes from the admin course form ── */
  alternateName?: string;
  courseCode?: string;
  educationalLevel?: string;
  /** Total course length, ISO-8601 (e.g. "P8W"). */
  timeRequired?: string;
  credentialAwarded?: string;
  prerequisites?: string;
  teaches?: string[];
  audience?: string;
  availableLanguage?: string[];
  /** One offer per stored currency. */
  offers?: { price: number; currency: string; validFrom?: string; priceValidUntil?: string }[];
  instances?: CourseInstanceInput[];
  courseMode?: string;
  instructors?: { name: string; url?: string }[];
}) {
  const {
    rating, reviewCount, reviews, offers = [], instances = [], teaches = [],
    availableLanguage = [], instructors = [],
  } = opts;

  // Past cohorts are dropped — a stale instance is worse than none.
  const today = new Date().toISOString().slice(0, 10);
  const future = instances.filter((i) => i.startDate && i.endDate && i.startDate >= today);

  const offerNodes = offers
    .filter((o) => o.price > 0 && o.currency)
    .map((o) => ({
      "@type": "Offer",
      price: o.price,
      priceCurrency: o.currency,
      category: "Paid",
      url: opts.url,
      availability: "https://schema.org/InStock",
      ...(o.validFrom ? { validFrom: o.validFrom } : {}),
      ...(o.priceValidUntil ? { priceValidUntil: o.priceValidUntil } : {}),
    }));

  // Back-compat: callers that still pass a single price get one offer.
  if (!offerNodes.length && opts.price && opts.price > 0) {
    offerNodes.push({
      "@type": "Offer",
      price: opts.price,
      priceCurrency: opts.currency ?? "EGP",
      category: "Paid",
      url: opts.url,
      availability: "https://schema.org/InStock",
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    ...(opts.image ? { image: opts.image } : {}),
    inLanguage: opts.locale,
    ...(opts.alternateName ? { alternateName: opts.alternateName } : {}),
    ...(opts.courseCode ? { courseCode: opts.courseCode } : {}),
    ...(opts.educationalLevel ? { educationalLevel: opts.educationalLevel } : {}),
    ...(opts.timeRequired ? { timeRequired: opts.timeRequired } : {}),
    ...(opts.credentialAwarded ? { educationalCredentialAwarded: opts.credentialAwarded } : {}),
    ...(opts.prerequisites ? { coursePrerequisites: opts.prerequisites } : {}),
    ...(teaches.length ? { teaches } : {}),
    ...(opts.audience ? { audience: { "@type": "Audience", audienceType: opts.audience } } : {}),
    ...(availableLanguage.length ? { availableLanguage } : {}),
    // Reference the organization node emitted once in the public layout rather
    // than repeating it inline, so both resolve to the same entity.
    provider: { "@id": ORGANIZATION_ID },

    ...(future.length
      ? {
          hasCourseInstance: future.map((i) => ({
            "@type": "CourseInstance",
            courseMode: opts.courseMode ?? "online",
            startDate: i.startDate,
            endDate: i.endDate,
            ...(isoDuration(i.weeklyHours ?? 0) ? { courseWorkload: isoDuration(i.weeklyHours ?? 0) } : {}),
            ...(i.dayOfWeek || i.sessionTime
              ? {
                  courseSchedule: {
                    "@type": "Schedule",
                    ...(i.dayOfWeek ? { byDay: i.dayOfWeek } : {}),
                    ...(i.sessionTime ? { startTime: i.sessionTime } : {}),
                    ...(i.timezone ? { scheduleTimezone: i.timezone } : {}),
                    ...(isoMinutes(i.sessionDurationMinutes ?? 0)
                      ? { duration: isoMinutes(i.sessionDurationMinutes ?? 0) }
                      : {}),
                    repeatFrequency: "P1W",
                  },
                }
              : {}),
            location: { "@type": "VirtualLocation", url: opts.url },
            ...(availableLanguage.length ? { inLanguage: availableLanguage } : {}),
            // The instance is what a buyer actually purchases, so it carries the
            // same multi-currency offers as the course.
            ...(offerNodes.length ? { offers: offerNodes } : {}),
            ...(instructors.length
              ? {
                  instructor: instructors.map((p) => ({
                    "@type": "Person",
                    name: p.name,
                    ...(p.url ? { url: p.url } : {}),
                  })),
                }
              : {}),
          })),
        }
      : {}),

    // Gated: rating and review markup are emitted ONLY when real, consented
    // reviews exist. With none, both nodes are omitted entirely.
    ...(rating && rating > 0 && reviewCount && reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews?.length
      ? {
          review: reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            reviewBody: r.body,
            ...(r.datePublished ? { datePublished: r.datePublished } : {}),
          })),
        }
      : {}),
    ...(offerNodes.length ? { offers: offerNodes } : {}),
  };
}

/**
 * A real, watchable video. Only call this when the course actually has one —
 * a VideoObject describing a video that does not exist on the page is a
 * structured-data violation, not a missing nice-to-have.
 */
export function courseVideoLd(opts: {
  name: string;
  description: string;
  videoId: string;
  contentUrl: string;
  uploadDate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: opts.name,
    description: opts.description,
    thumbnailUrl: `https://i.ytimg.com/vi/${opts.videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${opts.videoId}`,
    contentUrl: opts.contentUrl,
    ...(opts.uploadDate ? { uploadDate: opts.uploadDate } : {}),
    isFamilyFriendly: true,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
