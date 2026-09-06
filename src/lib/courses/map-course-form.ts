/**
 * Maps a backend course document (`GET /courses/:id`, with category/subcategory/
 * tags populated and `variables` as a Map) onto the admin course form's
 * view-model (`CourseFormValues`). This is the inverse of `to-course-payload`
 * and feeds the "Edit course" wizard so every field is pre-filled.
 *
 * Only meaningful values are returned (a `Partial`); the form merges these over
 * `makeDefaultCourseValues()`, so required-but-empty fields keep their defaults
 * instead of being clobbered with empty strings.
 */
import type { CourseFormValues } from "@/validations/course-schema";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Pull an id out of a value that may be a raw id string or a populated doc. */
const idOf = (v: any): string =>
  !v ? "" : typeof v === "string" ? v : String(v._id ?? v.id ?? "");

const strArr = (v: any): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/** ISO date/datetime → the `yyyy-mm-dd` a native date input expects. */
const dateInput = (v: any): string => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const pricingBlock = (p: any) => ({
  price: Number(p?.price) || 0,
  salePrice: Number(p?.salePrice) || 0,
  discount: Number(p?.discount) || 0,
});

const LESSON_TYPES = ["video", "quiz", "pdf", "text"] as const;

export function mapCourseToForm(raw: any): Partial<CourseFormValues> {
  if (!raw || typeof raw !== "object") return {};

  // `variables` arrives as a Map (rare) or a plain object once serialized.
  const vars = raw.variables;
  const vget = (k: string): unknown =>
    vars instanceof Map ? vars.get(k) : vars?.[k];

  const out: Partial<CourseFormValues> = {
    titleEn: raw.titleEn ?? "",
    titleAr: raw.titleAr ?? "",
    slug: raw.slug ?? "",
    category: idOf(raw.category),
    descriptionEn: raw.descriptionEn ?? "",
    descriptionAr: raw.descriptionAr ?? "",
    headlineEn: raw.headlineEn ?? "",
    headlineAr: raw.headlineAr ?? "",
    subHeadlineEn: raw.subHeadlineEn ?? "",
    subHeadlineAr: raw.subHeadlineAr ?? "",
    whoCanAttendEn: raw.whoCanAttendEn ?? "",
    whoCanAttendAr: raw.whoCanAttendAr ?? "",
    whyChoose: Array.isArray(raw.whyChoose)
      ? raw.whyChoose.map((r: any) => ({
          titleEn: r?.titleEn ?? "",
          titleAr: r?.titleAr ?? "",
          bodyEn: r?.bodyEn ?? "",
          bodyAr: r?.bodyAr ?? "",
        }))
      : [],
    faqs: Array.isArray(raw.faqs)
      ? raw.faqs.map((f: any) => ({
          questionEn: f?.questionEn ?? "",
          questionAr: f?.questionAr ?? "",
          answerEn: f?.answerEn ?? "",
          answerAr: f?.answerAr ?? "",
        }))
      : [],
    careerRoles: Array.isArray(raw.careerRoles)
      ? raw.careerRoles.map((r: any) => ({
          titleEn: r?.titleEn ?? "",
          titleAr: r?.titleAr ?? "",
          descriptionEn: r?.descriptionEn ?? "",
          descriptionAr: r?.descriptionAr ?? "",
        }))
      : [],
    relatedCourseSlugs: Array.isArray(raw.relatedCourseSlugs)
      ? raw.relatedCourseSlugs.filter((x: unknown): x is string => typeof x === "string")
      : [],
    quote: {
      textEn: raw.quote?.textEn ?? "",
      textAr: raw.quote?.textAr ?? "",
    },
    finalCta: {
      headingEn: raw.finalCta?.headingEn ?? "",
      headingAr: raw.finalCta?.headingAr ?? "",
      bodyEn: raw.finalCta?.bodyEn ?? "",
      bodyAr: raw.finalCta?.bodyAr ?? "",
    },
    headings: {
      whyChooseEn: raw.headings?.whyChooseEn ?? "",
      whyChooseAr: raw.headings?.whyChooseAr ?? "",
      audienceEn: raw.headings?.audienceEn ?? "",
      audienceAr: raw.headings?.audienceAr ?? "",
      learnEn: raw.headings?.learnEn ?? "",
      learnAr: raw.headings?.learnAr ?? "",
      careersEn: raw.headings?.careersEn ?? "",
      careersAr: raw.headings?.careersAr ?? "",
      aboutEn: raw.headings?.aboutEn ?? "",
      aboutAr: raw.headings?.aboutAr ?? "",
      faqEn: raw.headings?.faqEn ?? "",
      faqAr: raw.headings?.faqAr ?? "",
    },
    pricing: {
      egp: pricingBlock(raw.pricing?.egp),
      sar: pricingBlock(raw.pricing?.sar),
      usd: pricingBlock(raw.pricing?.usd),
    },
    image: raw.image ?? "",
    gallery: strArr(raw.gallery),
    students: Number(raw.students) || 0,
    lectures: Number(raw.lectures) || 0,
    duration: raw.duration ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags.map(idOf).filter(Boolean) : [],
    instructorIds: Array.isArray(raw.instructorIds)
      ? raw.instructorIds.map(idOf).filter(Boolean)
      : [],
    previewVideoUrl: raw.previewVideoUrl ?? "",
    courseOverviewFile: raw.courseOverview ?? "",
    brochureUrl: raw.brochureUrl ?? "",
    status: raw.status === "published" ? "published" : "draft",
    isActive: raw.isActive !== false,
    isFeatured: !!raw.isFeatured,
    isBestseller: !!raw.isBestseller,
    isTopRated: !!raw.isTopRated,
    seo: {
      metaTitleEn: raw.seo?.metaTitleEn ?? "",
      metaTitleAr: raw.seo?.metaTitleAr ?? "",
      metaDescriptionEn: raw.seo?.metaDescriptionEn ?? "",
      metaDescriptionAr: raw.seo?.metaDescriptionAr ?? "",
      metaKeywordsEn: strArr(raw.seo?.metaKeywordsEn),
      metaKeywordsAr: strArr(raw.seo?.metaKeywordsAr),
    },
    courseCode: raw.courseCode ?? "",
    educationalLevel: raw.educationalLevel ?? "",
    credentialAwardedEn: raw.credentialAwardedEn ?? "",
    credentialAwardedAr: raw.credentialAwardedAr ?? "",
    prerequisitesEn: raw.prerequisitesEn ?? "",
    prerequisitesAr: raw.prerequisitesAr ?? "",
    teachesEn: strArr(raw.teachesEn),
    teachesAr: strArr(raw.teachesAr),
    canonicalOverride: raw.canonicalOverride ?? "",
    robotsDirective: (raw.robotsDirective ?? "index,follow") as CourseFormValues["robotsDirective"],
    ogImage: raw.ogImage ?? "",
    ogImageAlt: raw.ogImageAlt ?? "",
    imageAltEn: raw.imageAltEn ?? "",
    imageAltAr: raw.imageAltAr ?? "",
    suppressBrandSuffix: Boolean(raw.suppressBrandSuffix),
    intakes: Array.isArray(raw.intakes)
      ? raw.intakes.map((i: any) => ({
          startDate: dateInput(i?.startDate),
          endDate: dateInput(i?.endDate),
          dayOfWeek: i?.dayOfWeek ?? "",
          sessionTime: i?.sessionTime ?? "",
          timezone: i?.timezone || "Africa/Cairo",
          weeklyHours: Number(i?.weeklyHours) || 0,
          sessionDurationMinutes: Number(i?.sessionDurationMinutes) || 0,
          seatsAvailable: Number(i?.seatsAvailable) || 0,
          status: (i?.status ?? "open") as "open" | "closed" | "full",
        }))
      : [],
    proof: {
      passRate: Number(raw.proof?.passRate) || 0,
      passRateBasisEn: raw.proof?.passRateBasisEn ?? "",
      passRateBasisAr: raw.proof?.passRateBasisAr ?? "",
      passRateVerifiedAt: dateInput(raw.proof?.passRateVerifiedAt),
    },
    instructorProfile: {
      name: raw.instructorProfile?.name ?? "",
      title: raw.instructorProfile?.title ?? "",
      image: raw.instructorProfile?.image ?? "",
      bio: raw.instructorProfile?.bio ?? "",
      yearsExperience: Number(raw.instructorProfile?.yearsExperience) || 0,
      hospitals: Array.isArray(raw.instructorProfile?.hospitals)
        ? raw.instructorProfile.hospitals.filter((h: unknown): h is string => typeof h === "string")
        : [],
      certifications: Array.isArray(raw.instructorProfile?.certifications)
        ? raw.instructorProfile.certifications.filter((c: unknown): c is string => typeof c === "string")
        : [],
      linkedIn: raw.instructorProfile?.linkedIn ?? "",
    },
    textReviews: Array.isArray(raw.textReviews)
      ? raw.textReviews.map((r: any) => ({
          reviewerName: r?.reviewerName ?? "",
          title: r?.title ?? "",
          reviewerImage: r?.reviewerImage ?? "",
          rating: Number(r?.rating) || 0,
          comment: r?.comment ?? "",
          country: r?.country ?? "",
          datePublished: dateInput(r?.datePublished),
          consentToPublish: Boolean(r?.consentToPublish),
          verified: Boolean(r?.verified),
        }))
      : [],
    videosReviews: Array.isArray(raw.videosReviews)
      ? raw.videosReviews.map((r: any) => ({ url: r?.url ?? "" }))
      : [],
    imagesReviews: Array.isArray(raw.imagesReviews)
      ? raw.imagesReviews.map((r: any) => ({ url: r?.url ?? "" }))
      : [],
  };

  // Learning outcomes — only override the default when the course has them.
  const wylEn = strArr(raw.whatYouWillLearnEn);
  if (wylEn.length) out.whatYouWillLearnEn = wylEn;
  const wylAr = strArr(raw.whatYouWillLearnAr);
  if (wylAr.length) out.whatYouWillLearnAr = wylAr;

  // Curriculum — keep the sample module default when the course has none.
  if (Array.isArray(raw.modules) && raw.modules.length) {
    out.modules = raw.modules.map((m: any, mi: number) => ({
      id: idOf(m) || `mod-${mi}`,
      titleEn: m?.titleEn ?? "",
      titleAr: m?.titleAr ?? "",
      order: typeof m?.order === "number" ? m.order : mi,
      lessons: Array.isArray(m?.lessons)
        ? m.lessons.map((l: any, li: number) => ({
            id: idOf(l) || `les-${mi}-${li}`,
            lesson_type: LESSON_TYPES.includes(l?.lesson_type) ? l.lesson_type : "video",
            titleEn: l?.titleEn ?? "",
            titleAr: l?.titleAr ?? "",
            order: typeof l?.order === "number" ? l.order : li,
            videoUrl: l?.videoUrl ?? "",
            isFreePreview: !!l?.isFreePreview,
            duration: l?.duration ?? "",
          }))
        : [],
    }));
  }

  // Form-only fields stashed under `variables` (best-effort; not always present).
  const programType = vget("programType");
  if (typeof programType === "string" && programType) out.programType = programType;
  const attendanceMode = vget("attendanceMode");
  if (attendanceMode === "online-zoom" || attendanceMode === "offline")
    out.attendanceMode = attendanceMode;
  const webhookUrl = vget("webhookUrl");
  if (typeof webhookUrl === "string") out.webhookUrl = webhookUrl;
  const language = vget("language");
  const LANGS = ["English", "Arabic", "French", "Spanish"] as const;
  if (Array.isArray(language)) {
    const langs = language.filter((l): l is (typeof LANGS)[number] =>
      (LANGS as readonly string[]).includes(l),
    );
    if (langs.length) out.language = langs;
  }

  return out;
}
