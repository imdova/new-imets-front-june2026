/**
 * Lookup DAL — categories (with dependent subcategories), instructors and tags
 * for the course form's select / search-select fields.
 */
import { ok, fail, toMessage, type Result } from "@integration/lib/api-client";
import * as categoriesSvc from "@integration/services/categories";
import * as subCategoriesSvc from "@integration/services/sub-categories";
import * as tagsSvc from "@integration/services/tags";
import { instructorService } from "@integration/services/instructors";
import * as db from "@/lib/db/lookups";
import type { CategoryLookup, InstructorLookup, LookupItem } from "@/types";

const arr = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : ((x as { data?: T[] })?.data ?? []));

/** LIVE: categories from GET /categories, with their /sub-categories grouped in. */
export async function fetchCategories(): Promise<Result<CategoryLookup[]>> {
  const [catsRes, subsRes] = await Promise.all([
    categoriesSvc.listCategories(),
    subCategoriesSvc.listSubCategories(),
  ]);
  if (!catsRes.ok) return catsRes;
  try {
    const cats = arr<any>(catsRes.data);
    const subs = subsRes.ok ? arr<any>(subsRes.data) : [];
    const byParent = new Map<string, LookupItem[]>();
    for (const s of subs) {
      const pid = s?.parentCategory?._id ?? s?.parentCategory ?? s?.parentCategoryId;
      if (!pid) continue;
      const item: LookupItem = { id: s._id, label: s.nameEn ?? s.nameAr ?? "—", labelAr: s.nameAr };
      const list = byParent.get(pid) ?? [];
      list.push(item);
      byParent.set(pid, list);
    }
    const out: CategoryLookup[] = cats.map((c) => ({
      id: c._id,
      label: c.nameEn ?? c.nameAr ?? "—",
      labelAr: c.nameAr,
      slug: c.slug || c._id,
      subcategories: byParent.get(c._id) ?? [],
    }));
    return ok(out);
  } catch (err) {
    return fail(toMessage(err, "Failed to load categories"));
  }
}

/** LIVE: instructors from GET /instructors, mapped to the course-form lookup. */
export async function fetchInstructors(): Promise<Result<InstructorLookup[]>> {
  const res = await instructorService.getAll({ limit: 200 } as never);
  if (!res.ok) return res;
  try {
    return ok(
      arr<any>(res.data)
        .map((r): InstructorLookup => ({
          id: r._id ?? r.id ?? "",
          label: r.name ?? ([r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "Instructor"),
          slug: r.slug || r._id || r.id || "",
          avatarUrl: r.avatar ?? r.image ?? r.avatarUrl ?? r.profileImage,
          title: r.title ?? r.jobTitle ?? r.professionalTitle ?? r.specialty ?? r.headline,
          // Public-profile fields. Carried through here rather than in a second
          // fetch so the profile page and the dropdowns share one request.
          bio: r.bio ?? undefined,
          specialty: r.specialty ?? undefined,
          yearsOfExperience:
            typeof r.yearsOfExperience === "number" ? r.yearsOfExperience : undefined,
          certificates: Array.isArray(r.certificates)
            ? r.certificates.filter((c: unknown): c is string => typeof c === "string" && !!c.trim())
            : undefined,
          country: r.country ?? undefined,
          website: r.website ?? undefined,
          socialLinks: Array.isArray(r.socialLinks)
            ? r.socialLinks.filter(
                (s: unknown): s is { key: string; value: string } =>
                  !!s && typeof (s as { value?: unknown }).value === "string",
              )
            : undefined,
        }))
        .filter((i) => i.id),
    );
  } catch (err) {
    return fail(toMessage(err, "Failed to load instructors"));
  }
}

/** LIVE: tags from GET /tags. */
export async function fetchTags(): Promise<Result<LookupItem[]>> {
  const res = await tagsSvc.listTags();
  if (!res.ok) return res;
  try {
    const tags = arr<any>(res.data);
    return ok(tags.map((tg) => ({ id: tg._id, label: tg.nameEn ?? tg.nameAr ?? tg.name ?? "—", labelAr: tg.nameAr })));
  } catch (err) {
    return fail(toMessage(err, "Failed to load tags"));
  }
}
