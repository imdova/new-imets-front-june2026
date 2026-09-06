import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Briefcase, GraduationCap, ChevronRight, Globe, ExternalLink, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/features/marketing/components/course-card";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, seoAlternates, socialMeta, localeUrl, personLd, breadcrumbLd } from "@/lib/seo";
import { mergeSeo } from "@/lib/public-seo";

/**
 * Public faculty profile.
 *
 * This page previously asserted, for every instructor alike, a 4.8 rating,
 * eight years of experience, twelve courses, a paragraph about their "deep
 * industry experience", and three courses taken from the top of the catalogue
 * regardless of who taught them. On a healthcare-education site those are
 * fabricated professional credentials attached to a named real person — the
 * most damaging thing this codebase could publish, and the exact pattern the
 * review-integrity work removed elsewhere.
 *
 * Everything now renders from stored fields and nothing renders without them.
 * A sparse profile is the correct output for a sparse record.
 */

/** Pull a LinkedIn URL out of the free-form social links, if present. */
function findSocial(
  links: { key: string; value: string }[] | undefined,
  needle: string,
): string | undefined {
  const hit = links?.find((l) => l.key?.toLowerCase().includes(needle));
  if (!hit?.value) return undefined;
  return hit.value.startsWith("http") ? hit.value : `https://${needle}.com/in/${hit.value.replace(/^@/, "")}`;
}

/** Absolute profile URLs elsewhere — `sameAs` in the Person node. */
function sameAsUrls(instructor: { website?: string; socialLinks?: { key: string; value: string }[] }) {
  const urls = [instructor.website, ...(instructor.socialLinks ?? []).map((l) => l.value)];
  return urls.filter((u): u is string => !!u && /^https?:\/\//i.test(u));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const res = await dal.lookups.fetchInstructors();
  const instructor = res.ok ? res.data.find((i) => (i.slug || i.id) === id || i.id === id) : null;
  if (!instructor) return {};
  const title = instructor.label;
  const description =
    instructor.bio?.trim() ||
    `${instructor.label}${instructor.title ? ` — ${instructor.title}` : ""}. ${SITE_NAME} instructor.`;
  const path = `/instructors/${instructor.slug || instructor.id}`;
  return mergeSeo(path, {
    title,
    description,
    alternates: seoAlternates(path, locale),
    ...socialMeta({ title: `${title} · ${SITE_NAME}`, description, path, locale, image: instructor.avatarUrl }),
  });
}

export default async function InstructorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Marketing");
  const ar = locale === "ar";

  const [instructorsRes, coursesRes] = await Promise.all([
    dal.lookups.fetchInstructors(),
    dal.courses.fetchCourses({ status: "published" }),
  ]);
  const instructors = instructorsRes.ok ? instructorsRes.data : [];
  const instructor = instructors.find((i) => (i.slug || i.id) === id);
  if (!instructor) {
    // Old id-based URL → send it to the clean slug.
    const byId = instructors.find((i) => i.id === id && i.slug && i.slug !== i.id);
    if (byId) redirect({ href: `/instructors/${byId.slug}`, locale });
    notFound();
  }

  /*
   * Only courses that actually name this instructor. The previous
   * `.slice(0, 3)` listed the first three courses in the catalogue on every
   * profile, so each instructor appeared to teach programmes they have no
   * connection to. No match ⇒ the section is omitted rather than padded.
   */
  const courses = (coursesRes.ok ? coursesRes.data : []).filter(
    (c) =>
      c.instructorIds?.includes(instructor.id) ||
      (!!c.instructorProfile?.name &&
        c.instructorProfile.name.trim().toLowerCase() === instructor.label.trim().toLowerCase()),
  );

  const url = localeUrl(`/instructors/${instructor.slug || instructor.id}`, locale);
  const linkedIn = findSocial(instructor.socialLinks, "linkedin");
  const certificates = instructor.certificates ?? [];
  /* Topical authority, from what is stored: their specialty and their certifications. */
  const knowsAbout = [instructor.specialty, ...certificates].filter(
    (v): v is string => !!v && !!v.trim(),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          personLd({
            name: instructor.label,
            jobTitle: instructor.title,
            description: instructor.bio,
            image: instructor.avatarUrl,
            url,
            locale,
            knowsAbout,
            sameAs: sameAsUrls(instructor),
          }),
          breadcrumbLd([
            { name: ar ? "الرئيسية" : "Home", url: localeUrl("/", locale) },
            { name: ar ? "الأساتذة" : "Faculty", url: localeUrl("/instructors", locale) },
            { name: instructor.label, url },
          ]),
        ]}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <Link href="/instructors" className="hover:text-foreground">{ar ? "الأساتذة" : "Faculty"}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" />
        <span className="line-clamp-1 text-foreground">{instructor.label}</span>
      </nav>

      <div className="flex flex-col items-start gap-6 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/5 to-card p-6 sm:flex-row sm:items-center sm:p-8">
        {instructor.avatarUrl ? (
          <Image
            src={instructor.avatarUrl}
            alt=""
            width={96}
            height={96}
            className="size-24 rounded-full border-2 border-background object-cover shadow-md"
          />
        ) : (
          <span className="grid size-24 shrink-0 place-items-center rounded-full border-2 border-background bg-primary/10 text-2xl font-semibold text-primary shadow-md">
            {getInitials(instructor.label)}
          </span>
        )}
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">{instructor.label}</h1>
          {instructor.title && <p className="text-muted-foreground">{instructor.title}</p>}

          {/* Each badge appears only if the underlying value is actually stored. */}
          <div className="flex flex-wrap gap-2 pt-1">
            {typeof instructor.yearsOfExperience === "number" && instructor.yearsOfExperience > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Briefcase className="size-3.5" />
                {t("yearsExperience", { count: instructor.yearsOfExperience })}
              </Badge>
            )}
            {courses.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="size-3.5" />
                {courses.length} {ar ? "برنامج" : courses.length === 1 ? "course" : "courses"}
              </Badge>
            )}
            {instructor.country && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="size-3.5" />
                {instructor.country}
              </Badge>
            )}
          </div>

          {(linkedIn || instructor.website) && (
            <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
              {linkedIn && (
                <a
                  href={linkedIn}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <ExternalLink className="size-4" /> LinkedIn
                </a>
              )}
              {instructor.website && (
                <a
                  href={instructor.website}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="size-4" /> {ar ? "الموقع الشخصي" : "Website"}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {instructor.bio?.trim() && (
        <div className="mt-8 max-w-3xl space-y-4">
          <h2 className="font-heading text-xl font-semibold">{t("aboutInstructor")}</h2>
          <p className="leading-relaxed text-muted-foreground">{instructor.bio}</p>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="mt-8 max-w-3xl">
          <h2 className="font-heading text-xl font-semibold">
            {ar ? "الشهادات المهنية" : "Credentials"}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {certificates.map((c) => (
              <li key={c}>
                <Badge variant="outline">{c}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {courses.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold tracking-tight">{t("coursesByInstructor")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
