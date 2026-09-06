/**
 * Maps a backend course document (`GET /courses`) to the UI `CourseRow` shape.
 * Pure + client-safe.
 */
import type { CourseRow, Difficulty, CourseStatus } from "@/types";

const FALLBACK_THUMB = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=240&fit=crop";

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Average rating across CONSENTED reviews only — the same set the page renders,
 * so the number and the wall beneath it can never disagree.
 */
function avgRating(reviews?: any[]): number {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const rated = reviews.filter((r) => typeof r?.rating === "number" && r?.consentToPublish);
  if (!rated.length) return 0;
  return Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10;
}

/** How many reviews may actually be published. */
function consentedCount(reviews?: any[]): number {
  return Array.isArray(reviews)
    ? reviews.filter((r) => r?.consentToPublish && String(r?.comment ?? "").trim()).length
    : 0;
}

export function mapCourse(raw: any): CourseRow {
  const egp = raw?.pricing?.egp ?? {};
  const sar = raw?.pricing?.sar ?? {};
  const usd = raw?.pricing?.usd ?? {};
  const lectures =
    typeof raw?.lectures === "number"
      ? raw.lectures
      : Array.isArray(raw?.modules)
        ? raw.modules.reduce((n: number, m: any) => n + (m?.items?.length ?? m?.lessons?.length ?? 0), 0)
        : 0;
  const category =
    typeof raw?.category === "string" ? raw.category : raw?.category?.nameEn ?? raw?.category?.nameAr ?? "—";
  // Keep the Arabic category name too — `category` alone is English-only, which
  // left Arabic pages labelling categories in English.
  const categoryAr =
    typeof raw?.category === "string" ? undefined : raw?.category?.nameAr || undefined;
  const difficulty: Difficulty =
    (["Beginner", "Intermediate", "Advanced"] as const).find((d) => d.toLowerCase() === String(raw?.level ?? "").toLowerCase()) ?? "Beginner";

  return {
    id: raw?._id ?? raw?.id,
    slug: raw?.slug ?? "",
    titleEn: raw?.titleEn ?? raw?.titleAr ?? "—",
    titleAr: raw?.titleAr ?? raw?.titleEn ?? "—",
    category,
    categoryAr,
    difficulty,
    priceEGP: egp.price ?? 0,
    salePriceEGP: egp.salePrice ?? 0,
    priceSAR: sar.price ?? 0,
    salePriceSAR: sar.salePrice ?? 0,
    priceUSD: usd.price ?? 0,
    salePriceUSD: usd.salePrice ?? 0,
    students: typeof raw?.students === "number" ? raw.students : Array.isArray(raw?.students) ? raw.students.length : 0,
    lectures,
    // Derived from consented reviews. A stored `rating` is only trusted when
    // there are consented reviews behind it — otherwise it is an orphan number.
    rating: consentedCount(raw?.textReviews) > 0
      ? (typeof raw?.rating === "number" && raw.rating > 0 ? raw.rating : avgRating(raw?.textReviews))
      : 0,
    reviewCount: consentedCount(raw?.textReviews),
    intakes: Array.isArray(raw?.intakes)
      ? raw.intakes.map((i: Record<string, unknown>) => ({
          startDate: String(i?.startDate ?? ""),
          endDate: String(i?.endDate ?? ""),
          dayOfWeek: String(i?.dayOfWeek ?? ""),
          sessionTime: String(i?.sessionTime ?? ""),
          timezone: String(i?.timezone ?? "Africa/Cairo"),
          weeklyHours: Number(i?.weeklyHours) || 0,
          sessionDurationMinutes: Number(i?.sessionDurationMinutes) || 0,
          seatsAvailable: Number(i?.seatsAvailable) || 0,
          status: (i?.status === "closed" || i?.status === "full" ? i.status : "open") as
            | "open" | "closed" | "full",
        }))
      : undefined,
    proof: raw?.proof && Number(raw.proof.passRate) > 0
      ? {
          passRate: Number(raw.proof.passRate),
          passRateBasisEn: String(raw.proof.passRateBasisEn ?? ""),
          passRateBasisAr: String(raw.proof.passRateBasisAr ?? ""),
          passRateVerifiedAt: raw.proof.passRateVerifiedAt ? String(raw.proof.passRateVerifiedAt) : "",
        }
      : undefined,
    courseCode: raw?.courseCode || undefined,
    educationalLevel: raw?.educationalLevel || undefined,
    credentialAwardedEn: raw?.credentialAwardedEn || undefined,
    credentialAwardedAr: raw?.credentialAwardedAr || undefined,
    prerequisitesEn: raw?.prerequisitesEn || undefined,
    prerequisitesAr: raw?.prerequisitesAr || undefined,
    teachesEn: Array.isArray(raw?.teachesEn) ? raw.teachesEn.filter(Boolean) : undefined,
    teachesAr: Array.isArray(raw?.teachesAr) ? raw.teachesAr.filter(Boolean) : undefined,
    canonicalOverride: raw?.canonicalOverride || undefined,
    robotsDirective: raw?.robotsDirective || undefined,
    ogImage: raw?.ogImage || undefined,
    ogImageAlt: raw?.ogImageAlt || undefined,
    imageAltEn: raw?.imageAltEn || undefined,
    imageAltAr: raw?.imageAltAr || undefined,
    suppressBrandSuffix: Boolean(raw?.suppressBrandSuffix),
    status: (raw?.status === "published" ? "published" : "draft") as CourseStatus,
    isFeatured: !!raw?.isFeatured,
    isBestseller: !!raw?.isBestseller,
    isTopRated: !!raw?.isTopRated,
    thumbnailUrl: raw?.image || raw?.gallery?.[0]?.url || raw?.gallery?.[0] || FALLBACK_THUMB,
    updatedAt: fmtDate(raw?.updatedAt),
    previewVideoUrl: raw?.previewVideoUrl || undefined,
    headlineEn: raw?.headlineEn || undefined,
    headlineAr: raw?.headlineAr || undefined,
    subHeadlineEn: raw?.subHeadlineEn || undefined,
    subHeadlineAr: raw?.subHeadlineAr || undefined,
    instructorProfile: raw?.instructorProfile && typeof raw.instructorProfile === "object"
      ? {
          name: raw.instructorProfile.name || undefined,
          title: raw.instructorProfile.title || undefined,
          image: raw.instructorProfile.image || undefined,
          bio: raw.instructorProfile.bio || undefined,
          yearsExperience: raw.instructorProfile.yearsExperience || undefined,
          hospitals: Array.isArray(raw.instructorProfile.hospitals)
            ? raw.instructorProfile.hospitals.map(String).filter(Boolean)
            : undefined,
          certifications: Array.isArray(raw.instructorProfile.certifications)
            ? raw.instructorProfile.certifications.map(String).filter(Boolean)
            : undefined,
          linkedIn: raw.instructorProfile.linkedIn || undefined,
          studentsTaught: raw.instructorProfile.studentsTaught || undefined,
          rating: raw.instructorProfile.rating || undefined,
        }
      : undefined,
    brochureUrl: raw?.brochureUrl || undefined,
    curriculumUrl: raw?.curriculumUrl || undefined,
    programGuideUrl: raw?.programGuideUrl || undefined,
    // The admin form uploads a course-overview PDF into `courseOverview`; expose
    // it so the "Download Brochure" button can actually use it.
    courseOverviewUrl: raw?.courseOverview || undefined,
    nextStartDate: raw?.nextStartDate || undefined,
    seatsLeft: typeof raw?.seatsLeft === "number" ? raw.seatsLeft : undefined,
    seatsTotal: typeof raw?.seatsTotal === "number" ? raw.seatsTotal : undefined,
    whatYouWillLearnEn: Array.isArray(raw?.whatYouWillLearnEn)
      ? raw.whatYouWillLearnEn.map(String).filter(Boolean)
      : undefined,
    whatYouWillLearnAr: Array.isArray(raw?.whatYouWillLearnAr)
      ? raw.whatYouWillLearnAr.map(String).filter(Boolean)
      : undefined,
    descriptionEn: raw?.descriptionEn || undefined,
    descriptionAr: raw?.descriptionAr || undefined,
    whoCanAttendEn: raw?.whoCanAttendEn || undefined,
    whoCanAttendAr: raw?.whoCanAttendAr || undefined,
    // Admin-managed search metadata. Blank strings are normalized to undefined
    // so `generateMetadata` can fall back rather than emit an empty tag.
    seo: raw?.seo && typeof raw.seo === "object"
      ? {
          metaTitleEn: raw.seo.metaTitleEn || undefined,
          metaTitleAr: raw.seo.metaTitleAr || undefined,
          metaDescriptionEn: raw.seo.metaDescriptionEn || undefined,
          metaDescriptionAr: raw.seo.metaDescriptionAr || undefined,
          metaKeywordsEn: Array.isArray(raw.seo.metaKeywordsEn)
            ? raw.seo.metaKeywordsEn.map(String).filter(Boolean)
            : undefined,
          metaKeywordsAr: Array.isArray(raw.seo.metaKeywordsAr)
            ? raw.seo.metaKeywordsAr.map(String).filter(Boolean)
            : undefined,
        }
      : undefined,
    // Per-course overrides for the "Why choose" cards and the FAQ. Rows with no
    // question/title are dropped so a half-filled admin row can't render blank.
    whyChoose: Array.isArray(raw?.whyChoose)
      ? raw.whyChoose
          .map((r: Record<string, string>) => ({
            titleEn: r?.titleEn ?? "",
            titleAr: r?.titleAr ?? "",
            bodyEn: r?.bodyEn ?? "",
            bodyAr: r?.bodyAr ?? "",
          }))
          .filter((r: { titleEn: string; titleAr: string }) => r.titleEn || r.titleAr)
      : undefined,
    faqs: Array.isArray(raw?.faqs)
      ? raw.faqs
          .map((f: Record<string, string>) => ({
            questionEn: f?.questionEn ?? "",
            questionAr: f?.questionAr ?? "",
            answerEn: f?.answerEn ?? "",
            answerAr: f?.answerAr ?? "",
          }))
          .filter((f: { questionEn: string; questionAr: string }) => f.questionEn || f.questionAr)
      : undefined,
    // Career Outcomes ladder. Array order is the progression, so it is kept as
    // authored; untitled rows are dropped so a blank row can't render an empty rung.
    careerRoles: Array.isArray(raw?.careerRoles)
      ? raw.careerRoles
          .map((r: Record<string, string>) => ({
            titleEn: r?.titleEn ?? "",
            titleAr: r?.titleAr ?? "",
            descriptionEn: r?.descriptionEn ?? "",
            descriptionAr: r?.descriptionAr ?? "",
          }))
          .filter((r: { titleEn: string; titleAr: string }) => r.titleEn || r.titleAr)
      : undefined,
    // Blank strings -> undefined so the page falls back per-heading rather than
    // rendering an empty H2.
    headings: raw?.headings && typeof raw.headings === "object"
      ? {
          whyChooseEn: raw.headings.whyChooseEn || undefined,
          whyChooseAr: raw.headings.whyChooseAr || undefined,
          audienceEn: raw.headings.audienceEn || undefined,
          audienceAr: raw.headings.audienceAr || undefined,
          learnEn: raw.headings.learnEn || undefined,
          learnAr: raw.headings.learnAr || undefined,
          careersEn: raw.headings.careersEn || undefined,
          careersAr: raw.headings.careersAr || undefined,
          aboutEn: raw.headings.aboutEn || undefined,
          aboutAr: raw.headings.aboutAr || undefined,
          faqEn: raw.headings.faqEn || undefined,
          faqAr: raw.headings.faqAr || undefined,
        }
      : undefined,
    // The form has saved these all along; nothing ever read them back out, so
    // the public wall showed the bundled sample reviews instead. Rows with no
    // name or no comment are dropped rather than rendered blank.
    // Consent is enforced HERE, at the data boundary, so no consumer can render
    // or mark up a named person's words without it. Legacy rows stored before
    // the consent field existed are treated as not consented — they must be
    // re-confirmed in the admin before they reappear.
    textReviews: Array.isArray(raw?.textReviews)
      ? raw.textReviews
          .map((r: Record<string, unknown>) => ({
            reviewerName: String(r?.reviewerName ?? ""),
            title: String(r?.title ?? ""),
            reviewerImage: String(r?.reviewerImage ?? ""),
            rating: typeof r?.rating === "number" ? r.rating : 0,
            comment: String(r?.comment ?? ""),
            country: String(r?.country ?? ""),
            datePublished: r?.datePublished ? String(r.datePublished) : "",
            verified: Boolean(r?.verified),
            consentToPublish: Boolean(r?.consentToPublish),
          }))
          .filter(
            (r: { reviewerName: string; comment: string; consentToPublish: boolean }) =>
              r.reviewerName && r.comment && r.consentToPublish,
          )
      : undefined,
    relatedCourseSlugs: Array.isArray(raw?.relatedCourseSlugs)
      ? raw.relatedCourseSlugs.filter((x: unknown): x is string => typeof x === "string" && !!x)
      : undefined,
    // Only when a heading was actually typed — an all-blank record must fall
    // through to the bundled line, not render an empty CTA.
    finalCta:
      raw?.finalCta && (raw.finalCta.headingEn || raw.finalCta.headingAr)
        ? {
            headingEn: raw.finalCta.headingEn ?? "",
            headingAr: raw.finalCta.headingAr ?? "",
            bodyEn: raw.finalCta.bodyEn ?? "",
            bodyAr: raw.finalCta.bodyAr ?? "",
          }
        : undefined,
    quote:
      raw?.quote && (raw.quote.textEn || raw.quote.textAr)
        ? { textEn: raw.quote.textEn ?? "", textAr: raw.quote.textAr ?? "" }
        : undefined,
    instructorNames: Array.isArray(raw?.instructors)
      ? raw.instructors
          .map((i: any) =>
            typeof i === "string"
              ? i
              : i?.name ?? [i?.firstName, i?.lastName].filter(Boolean).join(" ").trim() ?? i?.nameEn ?? "",
          )
          .filter(Boolean)
      : Array.isArray(raw?.instructorIds)
        ? raw.instructorIds
            .map((i: any) =>
              typeof i === "string"
                ? ""
                : i?.name ?? [i?.firstName, i?.lastName].filter(Boolean).join(" ").trim() ?? "",
            )
            .filter(Boolean)
        : undefined,
    // Ids only — `instructorIds` may arrive as raw ObjectId strings or as
    // populated user documents depending on the endpoint.
    instructorIds: Array.isArray(raw?.instructorIds)
      ? raw.instructorIds
          .map((i: any) => (typeof i === "string" ? i : i?._id ?? i?.id ?? ""))
          .filter(Boolean)
      : undefined,
    tagLabels: Array.isArray(raw?.tags)
      ? raw.tags
          .map((tg: any) => (typeof tg === "string" ? tg : tg?.nameEn ?? tg?.nameAr ?? tg?.name ?? ""))
          .filter(Boolean)
      : undefined,
    duration: typeof raw?.duration === "string" ? raw.duration : undefined,
    languages: (() => {
      const vars = raw?.variables;
      const fromVars = vars instanceof Map ? vars.get("language") : vars?.language;
      if (Array.isArray(fromVars)) return fromVars.map(String).filter(Boolean);
      if (typeof fromVars === "string" && fromVars) return [fromVars];
      if (Array.isArray(raw?.language)) return raw.language.map(String).filter(Boolean);
      if (typeof raw?.language === "string" && raw.language) return [raw.language];
      return undefined;
    })(),
    deliveryModes: (() => {
      const vars = raw?.variables;
      const attendance = vars instanceof Map ? vars.get("attendanceMode") : vars?.attendanceMode;
      const modes: string[] = [];
      if (typeof attendance === "string" && attendance) modes.push(attendance);
      if (typeof raw?.attendanceMode === "string" && raw.attendanceMode) modes.push(raw.attendanceMode);
      if (Array.isArray(raw?.deliveryModes)) modes.push(...raw.deliveryModes.map(String));
      return modes.length ? modes : undefined;
    })(),
    modules: Array.isArray(raw?.modules)
      ? raw.modules.map((m: any) => ({
          titleEn: m?.titleEn ?? m?.titleAr ?? "Module",
          titleAr: m?.titleAr ?? m?.titleEn ?? "",
          lessons: (m?.lessons ?? m?.items ?? []).map((l: any) => ({
            titleEn: l?.titleEn ?? l?.titleAr ?? "Lesson",
            titleAr: l?.titleAr ?? l?.titleEn ?? "",
            duration: l?.duration || undefined,
            isFreePreview: !!l?.isFreePreview,
          })),
        }))
      : undefined,
  };
}
