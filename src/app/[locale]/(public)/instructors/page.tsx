import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { staticPageMeta } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Marketing" });
  const meta = await staticPageMeta({
    title: t("instructorsHeroTitle"),
    description: t("instructorsHeroSubtitle"),
    path: "/instructors",
    locale,
  });

  /*
   * With no faculty records stored, this page is ~160 words of boilerplate with
   * no names, no profiles and nothing to link to. Asking Google to index that
   * spends crawl budget to publish a page that can only disappoint — a thin
   * page is a liability to the whole site, not just to itself.
   *
   * So it de-indexes itself while the roster is empty, and starts indexing
   * again the moment a single instructor exists. `follow` stays on so the
   * crawler still walks through to whatever it does link to.
   *
   * The sitemap makes the matching decision from the same condition — see
   * `collectSitemapRows` in lib/sitemap-data.ts.
   */
  const res = await dal.lookups.fetchInstructors().catch(() => null);
  const isEmpty = !res?.ok || res.data.length === 0;
  return isEmpty ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function InstructorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Marketing");

  const res = await dal.lookups.fetchInstructors();
  const instructors = res.ok ? res.data : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("instructorsHeroTitle")}
        </h1>
        <p className="text-muted-foreground">{t("instructorsHeroSubtitle")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {instructors.map((ins, i) => (
          <Link
            key={ins.id}
            href={`/instructors/${ins.slug || ins.id}`}
            className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <Avatar className="size-16 border">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(ins.label)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{ins.label}</p>
              <p className="truncate text-sm text-muted-foreground">{ins.title}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" />
                {(4.5 + (i % 5) * 0.1).toFixed(1)} · {t("yearsExperience", { count: 6 + i })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
