/**
 * App-wide type barrel.
 *
 * Domain contracts are re-exported from the vendored integration package so the
 * UI speaks the exact same shapes as the real NestJS backend. App-only view
 * types (lookups, option sets) live here. The UI imports types from `@/types`
 * — never from `@integration/*` directly — keeping the backend seam in one place.
 */

export type {
  Course,
  Category,
  SubCategory,
  Review,
} from "@integration/types/course";

export type {
  CourseFormData,
  CourseModule,
  CourseLesson,
  LessonResource,
  PricingDetails,
  TextReview,
  VideoReview,
  ImageReview,
} from "@integration/types/courseForm";

export type {
  AdminStats,
  SalesData,
  TopCourse,
  TopInstructor,
} from "@integration/types/admin";

/* -------------------------------------------------------------------------- */
/*  App-level view types                                                       */
/* -------------------------------------------------------------------------- */

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type AttendanceMode = "online-zoom" | "offline";
export type CourseStatus = "draft" | "published";
export type CurrencyCode = "EGP" | "SAR" | "USD";
export type LanguageOption = "English" | "Arabic" | "French" | "Spanish";
export type LessonType = "video" | "quiz" | "pdf" | "text";

/** Lightweight lookup entity returned by the DAL for select/search fields. */
export interface LookupItem {
  id: string;
  label: string;
  labelAr?: string;
  /** URL-friendly slug (falls back to id when the backend has none yet). */
  slug?: string;
}

/** A category lookup that carries its dependent subcategories. */
export interface CategoryLookup extends LookupItem {
  subcategories: LookupItem[];
}

/** Instructor lookup for the many-to-many relations field. */
export interface InstructorLookup extends LookupItem {
  avatarUrl?: string;
  title?: string;
  /*
   * Public-profile fields, for `/instructors/[slug]` and the Person schema it
   * emits. Every one is optional and every one renders only when filled — the
   * profile page must never assert a credential, an affiliation or a number of
   * years that is not stored against this person.
   */
  bio?: string;
  specialty?: string;
  yearsOfExperience?: number;
  /** Certificate names or codes as entered by the admin. */
  certificates?: string[];
  country?: string;
  website?: string;
  /** Social profiles, e.g. `{ key: "LinkedIn", value: "https://..." }`. */
  socialLinks?: { key: string; value: string }[];
}

/** A course row as rendered in the admin courses DataTable. */
export interface CourseRow {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  /** Category name in English — also the stable key catalog filters match on. */
  category: string;
  /** Arabic category name, for display only. Absent on older/mock rows. */
  categoryAr?: string;
  difficulty: Difficulty;
  priceEGP: number;
  salePriceEGP: number;
  /** SAR pricing (shown to visitors in Saudi Arabia). 0 when not configured. */
  priceSAR?: number;
  salePriceSAR?: number;
  /** USD pricing (used by the online / PayPal checkout + shown outside EG/SA). 0 when not configured. */
  priceUSD?: number;
  salePriceUSD?: number;
  students: number;
  lectures: number;
  rating: number;
  status: CourseStatus;
  isFeatured: boolean;
  isBestseller: boolean;
  isTopRated: boolean;
  thumbnailUrl: string;
  updatedAt: string;
  /** Preview/promo video (YouTube URL) shown on the public course page. */
  previewVideoUrl?: string;
  /** Optional hero headline / sub-headline (falls back to the title if blank). */
  headlineEn?: string;
  headlineAr?: string;
  subHeadlineEn?: string;
  subHeadlineAr?: string;
  /** Public-page instructor profile (all optional — page renders what exists). */
  instructorProfile?: {
    name?: string;
    title?: string;
    image?: string;
    bio?: string;
    yearsExperience?: number;
    hospitals?: string[];
    certifications?: string[];
    linkedIn?: string;
    studentsTaught?: number;
    rating?: number;
  };
  /** Downloadable PDFs — empty string ⇒ the button is hidden. */
  brochureUrl?: string;
  curriculumUrl?: string;
  programGuideUrl?: string;
  /** Uploaded course-overview PDF (admin form → `courseOverview`). Used as the
   *  "Download Brochure" target when no dedicated brochure URL is set. */
  courseOverviewUrl?: string;
  /** Next cohort start (ISO) — drives "Starts in N days". */
  nextStartDate?: string;
  /** REAL remaining seats. Undefined ⇒ nothing shown (never fabricated). */
  seatsLeft?: number;
  seatsTotal?: number;
  /** Admin-managed "What you will learn" outcomes, per locale. */
  whatYouWillLearnEn?: string[];
  whatYouWillLearnAr?: string[];
  /** Long-form content for the public course page (HTML rich text or plain). */
  descriptionEn?: string;
  descriptionAr?: string;
  whoCanAttendEn?: string;
  whoCanAttendAr?: string;
  /** Admin-authored "Why Professionals Choose …" cards. Empty/absent ⇒ the
   *  public page falls back to the shared IMETS reasons. */
  whyChoose?: { titleEn: string; titleAr: string; bodyEn: string; bodyAr: string }[];
  /** Admin-authored FAQ. Empty/absent ⇒ the shared default questions. */
  faqs?: { questionEn: string; questionAr: string; answerEn: string; answerAr: string }[];
  /** Admin-authored "Career Outcomes" ladder, entry level first. Empty/absent ⇒
   *  the bundled per-course ladder. */
  careerRoles?: { titleEn: string; titleAr: string; descriptionEn?: string; descriptionAr?: string }[];
  /** Admin-curated "Continue Your Professional Journey" slugs. Empty/absent ⇒
   *  same-category courses. */
  relatedCourseSlugs?: string[];
  /** Admin-authored closing CTA. Absent/blank ⇒ the bundled or shared line. */
  finalCta?: { headingEn?: string; headingAr?: string; bodyEn?: string; bodyAr?: string };
  /** Editorial pull-quote. Both blank ⇒ the bundled demand line. */
  quote?: { textEn?: string; textAr?: string };
  /** Admin-authored keyword H2s. Blank fields ⇒ the generic headings. */
  headings?: {
    whyChooseEn?: string; whyChooseAr?: string;
    audienceEn?: string; audienceAr?: string;
    learnEn?: string; learnAr?: string;
    careersEn?: string; careersAr?: string;
    aboutEn?: string; aboutAr?: string;
    faqEn?: string; faqAr?: string;
  };
  /** Real student reviews typed into the course form (Media & Reviews).
   *  Only CONSENTED reviews reach this array (filtered in `mapCourse`), and an
   *  empty array means the page renders no reviews at all — never a sample wall. */
  textReviews?: {
    reviewerName: string;
    title: string;
    reviewerImage: string;
    rating: number;
    comment: string;
    country?: string;
    /** ISO date — emitted as `Review.datePublished`. */
    datePublished?: string;
    verified?: boolean;
    consentToPublish?: boolean;
  }[];
  /** How many consented reviews back `rating`. 0 ⇒ no rating is shown. */
  reviewCount?: number;
  /** Scheduled cohorts (course form → Structure). Feeds `hasCourseInstance`. */
  intakes?: {
    startDate: string;
    endDate: string;
    dayOfWeek?: string;
    sessionTime?: string;
    timezone?: string;
    weeklyHours?: number;
    sessionDurationMinutes?: number;
    seatsAvailable?: number;
    status?: "open" | "closed" | "full";
  }[];
  /** Verifiable outcome claims. Absent unless a pass rate AND its basis are stored. */
  proof?: {
    passRate: number;
    passRateBasisEn: string;
    passRateBasisAr: string;
    passRateVerifiedAt?: string;
  };
  /* ── Structured-data + indexing fields (course form) ── */
  courseCode?: string;
  educationalLevel?: string;
  credentialAwardedEn?: string;
  credentialAwardedAr?: string;
  prerequisitesEn?: string;
  prerequisitesAr?: string;
  teachesEn?: string[];
  teachesAr?: string[];
  canonicalOverride?: string;
  robotsDirective?: "index,follow" | "noindex,follow" | "noindex,nofollow";
  ogImage?: string;
  ogImageAlt?: string;
  imageAltEn?: string;
  imageAltAr?: string;
  suppressBrandSuffix?: boolean;
  /** Admin-authored search metadata (course form → SEO panel). Any blank field
   *  falls back to copy derived from the course itself in `generateMetadata`. */
  seo?: {
    metaTitleEn?: string;
    metaTitleAr?: string;
    metaDescriptionEn?: string;
    metaDescriptionAr?: string;
    metaKeywordsEn?: string[];
    metaKeywordsAr?: string[];
  };
  /** Curriculum modules with their lessons (for the collapsible curriculum). */
  modules?: CurriculumModule[];
  /** Instructor display names (for smart catalog search). */
  instructorNames?: string[];
  /** Ids of the faculty assigned to this course — links a profile page to it. */
  instructorIds?: string[];
  /** Tag labels (for smart catalog search). */
  tagLabels?: string[];
  /** Program duration label from the backend (e.g. "8 weeks"). */
  duration?: string;
  /** Teaching languages (English / Arabic / Bilingual…). */
  languages?: string[];
  /** Delivery modes (online, live, recorded, hybrid…). */
  deliveryModes?: string[];
}

export interface CurriculumLesson {
  titleEn: string;
  titleAr: string;
  duration?: string;
  isFreePreview?: boolean;
}

export interface CurriculumModule {
  titleEn: string;
  titleAr: string;
  lessons: CurriculumLesson[];
}

/** Generic async result mirroring the integration layer's `Result<T>`. */
export type { Result } from "@integration/lib/api-client";
