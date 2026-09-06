/**
 * Course Data Access Layer.
 *
 * The UI imports ONLY from `@/lib/dal/*` — never from `@/lib/db/*` (dummy data)
 * nor `@integration/services/*` (real API). That indirection is the migration
 * seam: to go live, swap the `db.*` calls below for the vendored integration
 * services (e.g. `import { courses } from "@integration/services/courses"`).
 * The `Result<T>` return shape is already identical, so no UI refactor follows.
 */
import { ok, fail, toMessage, type Result } from "@integration/lib/api-client";
import * as coursesSvc from "@integration/services/courses";
import * as db from "@/lib/db/courses";
import { mapCourse } from "@/lib/courses/map-course";
import { mapCourseToForm } from "@/lib/courses/map-course-form";
import type { CourseFormData, CourseRow } from "@/types";
import type { CourseFormValues } from "@/validations/course-schema";

/** LIVE: courses from GET /courses (public), mapped to the UI shape. */
export async function fetchCourses(
  params: db.ListCoursesParams = {},
): Promise<Result<CourseRow[]>> {
  const res = await coursesSvc.listCourses({
    limit: 200,
    search: params.search,
    status: params.status && params.status !== "all" ? params.status : undefined,
    categoryId: params.category,
  });
  if (!res.ok) return res;
  try {
    const payload = res.data as unknown as { data?: unknown[] } | unknown[];
    const rows: unknown[] = Array.isArray(payload) ? payload : payload?.data ?? [];
    return ok(rows.map(mapCourse));
  } catch (err) {
    return fail(toMessage(err, "Failed to load courses"));
  }
}

/** LIVE: single course from GET /courses/:id, mapped to the UI shape. */
export async function fetchCourse(
  id: string,
): Promise<Result<CourseRow | null>> {
  const res = await coursesSvc.getCourseById(id);
  if (!res.ok) return res;
  try {
    return ok(res.data ? mapCourse(res.data) : null);
  } catch (err) {
    return fail(toMessage(err, "Failed to load course"));
  }
}

/** Some endpoints wrap the entity in `{ data: ... }`; normalize before mapping. */
const unwrap = (d: unknown): unknown =>
  d && typeof d === "object" && "data" in (d as Record<string, unknown>)
    ? (d as { data: unknown }).data
    : d;

/** LIVE: single course mapped to the *edit form's* view-model (all fields). */
export async function fetchCourseForEdit(
  id: string,
): Promise<Result<Partial<CourseFormValues> | null>> {
  const res = await coursesSvc.getCourseById(id);
  if (!res.ok) return res;
  try {
    const raw = unwrap(res.data);
    return ok(raw ? mapCourseToForm(raw) : null);
  } catch (err) {
    return fail(toMessage(err, "Failed to load course"));
  }
}

/** LIVE: create a course via POST /courses. Strips form-only / client-only
 * fields so the strict backend DTO doesn't reject the request. */
export async function createCourse(
  data: CourseFormData,
): Promise<Result<CourseRow>> {
  const {
    variables: _v,
    webhookUrl: _w,
    courseOverview: _c,
    difficulty: _d,
    ...rest
  } = data as CourseFormData & {
    variables?: unknown;
    webhookUrl?: unknown;
    courseOverview?: unknown;
  };
  const VALID_LESSON = ["video", "quiz"] as const;
  const payload = {
    ...rest,
    modules: (rest.modules ?? []).map(({ id: _id, ...m }) => ({
      titleAr: m.titleAr || m.titleEn,
      titleEn: m.titleEn || m.titleAr,
      order: m.order,
      lessons: (m.lessons ?? []).map(({ id: _id, ...l }) => ({
        lesson_type: (VALID_LESSON as readonly string[]).includes(l.lesson_type)
          ? l.lesson_type
          : "video",
        titleAr: l.titleAr || l.titleEn,
        titleEn: l.titleEn || l.titleAr,
        order: l.order,
        videoUrl: l.videoUrl || undefined,
        isFreePreview: l.isFreePreview,
        duration: l.duration || undefined,
      })),
    })),
  };
  const res = await coursesSvc.createCourse(payload);
  if (!res.ok) return res;
  try {
    return ok(mapCourse(unwrap(res.data)));
  } catch (err) {
    return fail(toMessage(err, "Failed to create course"));
  }
}

/** Map a UI-shaped patch (CourseRow fields) to the backend update DTO. */
function toUpdatePayload(patch: Partial<CourseRow>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const pass: (keyof CourseRow)[] = [
    "titleEn", "titleAr", "slug", "category", "difficulty", "status",
    "isFeatured", "isBestseller", "isTopRated",
  ];
  for (const k of pass) if (k in patch) out[k] = patch[k];
  if ("priceEGP" in patch || "salePriceEGP" in patch) {
    out.pricing = { egp: { price: patch.priceEGP, salePrice: patch.salePriceEGP } };
  }
  return out;
}

/** LIVE: update a course via PATCH /courses/:id. */
export async function updateCourse(
  id: string,
  patch: Partial<CourseRow>,
): Promise<Result<CourseRow | null>> {
  const res = await coursesSvc.updateCourse(id, toUpdatePayload(patch));
  if (!res.ok) return res;
  try {
    return ok(res.data ? mapCourse(unwrap(res.data)) : null);
  } catch (err) {
    return fail(toMessage(err, "Failed to update course"));
  }
}

/** Map the full form payload to a backend-whitelisted PATCH body. Strips
 * client-only ids (modules/lessons) and the form-only `difficulty` field that
 * the strict (`forbidNonWhitelisted`) backend DTO would otherwise reject.
 * Form-only fields with no schema column (program type, attendance mode) are
 * persisted as STRING entries in the course's `variables` map so they survive a
 * round-trip; array-valued `language` is omitted (the map only holds strings). */
function toFullUpdatePayload(d: CourseFormData): Record<string, unknown> {
  const VALID_LESSON = ["video", "quiz"] as const;
  const variables: Record<string, string> = {};
  for (const [k, v] of Object.entries(d.variables ?? {})) {
    if (typeof v === "string" && v) variables[k] = v;
  }
  return {
    variables: Object.keys(variables).length ? variables : undefined,
    titleAr: d.titleAr,
    titleEn: d.titleEn,
    slug: d.slug,
    category: d.category || undefined,
    descriptionAr: d.descriptionAr,
    descriptionEn: d.descriptionEn,
    headlineAr: d.headlineAr || undefined,
    headlineEn: d.headlineEn || undefined,
    subHeadlineAr: d.subHeadlineAr || undefined,
    subHeadlineEn: d.subHeadlineEn || undefined,
    whoCanAttendAr: d.whoCanAttendAr,
    whoCanAttendEn: d.whoCanAttendEn,
    whatYouWillLearnAr: d.whatYouWillLearnAr,
    whatYouWillLearnEn: d.whatYouWillLearnEn,
    whyChoose: d.whyChoose ?? [],
    faqs: d.faqs ?? [],
    careerRoles: d.careerRoles ?? [],
    relatedCourseSlugs: d.relatedCourseSlugs ?? [],
    finalCta: d.finalCta,
    quote: d.quote,
    headings: d.headings,
    pricing: d.pricing,
    image: d.image,
    gallery: d.gallery,
    students: d.students,
    lectures: d.lectures,
    duration: d.duration,
    tags: d.tags,
    seo: d.seo,
    courseCode: d.courseCode,
    educationalLevel: d.educationalLevel,
    credentialAwardedEn: d.credentialAwardedEn,
    credentialAwardedAr: d.credentialAwardedAr,
    prerequisitesEn: d.prerequisitesEn,
    prerequisitesAr: d.prerequisitesAr,
    teachesEn: d.teachesEn,
    teachesAr: d.teachesAr,
    canonicalOverride: d.canonicalOverride,
    robotsDirective: d.robotsDirective,
    ogImage: d.ogImage,
    ogImageAlt: d.ogImageAlt,
    imageAltEn: d.imageAltEn,
    imageAltAr: d.imageAltAr,
    suppressBrandSuffix: d.suppressBrandSuffix,
    intakes: d.intakes,
    proof: d.proof,
    instructorProfile: d.instructorProfile,
    instructorIds: d.instructorIds,
    modules: (d.modules ?? []).map((m) => ({
      titleAr: m.titleAr || m.titleEn,
      titleEn: m.titleEn || m.titleAr,
      order: m.order,
      lessons: (m.lessons ?? []).map((l) => ({
        lesson_type: (VALID_LESSON as readonly string[]).includes(l.lesson_type)
          ? l.lesson_type
          : "video",
        titleAr: l.titleAr || l.titleEn,
        titleEn: l.titleEn || l.titleAr,
        order: l.order,
        videoUrl: l.videoUrl || undefined,
        isFreePreview: l.isFreePreview,
        duration: l.duration || undefined,
      })),
    })),
    textReviews: d.textReviews,
    videosReviews: d.videosReviews,
    imagesReviews: d.imagesReviews,
    previewVideoUrl: d.previewVideoUrl || undefined,
    courseOverview: d.courseOverview || undefined,
    brochureUrl: d.brochureUrl || undefined,
    status: d.status,
    isActive: d.isActive,
    isFeatured: d.isFeatured,
    isBestseller: d.isBestseller,
    isTopRated: d.isTopRated,
  };
}

/** LIVE: update a course from the full edit form via PATCH /courses/:id. */
export async function updateCourseForm(
  id: string,
  data: CourseFormData,
): Promise<Result<CourseRow | null>> {
  const res = await coursesSvc.updateCourse(id, toFullUpdatePayload(data));
  if (!res.ok) return res;
  try {
    return ok(res.data ? mapCourse(unwrap(res.data)) : null);
  } catch (err) {
    return fail(toMessage(err, "Failed to update course"));
  }
}

/** LIVE: delete a course via DELETE /courses/:id. */
export async function deleteCourse(id: string): Promise<Result<boolean>> {
  const res = await coursesSvc.deleteCourse(id);
  if (!res.ok) return res;
  return ok(true);
}

/** LIVE: duplicate a course via POST /courses/:id/duplicate. */
export async function duplicateCourse(
  id: string,
): Promise<Result<CourseRow | null>> {
  const res = await coursesSvc.duplicateCourse(id);
  if (!res.ok) return res;
  try {
    return ok(res.data ? mapCourse(unwrap(res.data)) : null);
  } catch (err) {
    return fail(toMessage(err, "Failed to duplicate course"));
  }
}
