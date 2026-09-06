import { setRequestLocale } from "next-intl/server";

import { dal } from "@/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { SeoManager } from "@/features/marketing-admin/components/seo-manager";
import { findCannibalisation } from "@/features/marketing-admin/lib/cannibalisation";

export const metadata = { robots: { index: false } };

const EMPTY_OVERVIEW = { avgPageScore: 0, pageOverrides: 0, redirects: 0, noindexPages: 0, issues: [] };
const EMPTY_SUMMARY = { total: 0, active: 0, valid: 0, needAttention: 0, healthScore: 100 };

export default async function SeoManagerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [overviewRes, settingsRes, publicPagesRes, redirectsRes, schemasRes, coursesRes, articlesRes] =
    await Promise.all([
      dal.seo.fetchOverview(),
      dal.seo.fetchSettings(),
      dal.seo.fetchPublicPages(),
      dal.seo.fetchRedirects(),
      dal.seo.fetchSchemas(),
      dal.courses.fetchCourses({ status: "published" }),
      dal.blog.fetchPublicArticles({ limit: 500 }),
    ]);

  /*
   * Cannibalisation is computed here rather than stored: it is a property of the
   * current set of titles, so any cached verdict would be stale the moment an
   * editor retitles a post. 58 URLs is a trivial pairwise comparison.
   */
  const cannibalIssues = findCannibalisation([
    ...(coursesRes.ok ? coursesRes.data : []).map((c) => ({
      url: `/courses/${c.slug}`,
      kind: "course" as const,
      title: c.seo?.metaTitleEn || c.titleEn,
    })),
    ...(articlesRes.ok ? articlesRes.data.data : []).map((p) => ({
      url: `/blog/${p.slug}`,
      kind: "post" as const,
      title: p.seoTitle || p.title,
    })),
  ]);

  if (!settingsRes.ok) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <PageHeader title="SEO Manager" description="Global SEO settings, page overrides, redirects and schema." />
        <p className="text-sm text-destructive">Failed to load SEO settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="SEO Manager"
        description="Control global search metadata, per-page overrides, and managed redirects."
      />
      <SeoManager
        overview={overviewRes.ok ? overviewRes.data : EMPTY_OVERVIEW}
        settings={settingsRes.data}
        publicPages={publicPagesRes.ok ? publicPagesRes.data : []}
        redirects={redirectsRes.ok ? redirectsRes.data : []}
        schemas={schemasRes.ok ? schemasRes.data.data : []}
        schemaSummary={schemasRes.ok ? schemasRes.data.summary : EMPTY_SUMMARY}
        cannibalIssues={cannibalIssues}
      />
    </div>
  );
}
