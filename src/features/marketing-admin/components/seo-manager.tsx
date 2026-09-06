"use client";

import * as React from "react";
import {
  LayoutGrid, SlidersHorizontal, FileText, Bot, Map, Braces, Shuffle, Eye, BarChart3, Globe, TriangleAlert,
  Split,
} from "lucide-react";

import type {
  SeoOverview, SeoSettings, SeoRedirect, SeoSchema, SchemaSummary,
} from "@/lib/db/seo";
import type { SeoPublicPage } from "@/lib/dal/seo";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SeoOverviewPanel } from "./seo-overview-panel";
import { SeoSettingsPanel } from "./seo-settings-panel";
import { SeoPagesPanel } from "./seo-pages-panel";
import { SeoRobotsPanel } from "./seo-robots-panel";
import { SeoRedirectsPanel } from "./seo-redirects-panel";
import { SeoSchemaPanel } from "./seo-schema-panel";
import { SeoPanelHead } from "./seo-panel-head";
import { SeoCannibalisationPanel } from "./seo-cannibalisation-panel";
import type { CannibalIssue } from "../lib/cannibalisation";
import {
  SeoSitemapsPanel, SeoBacklinksPanel, SeoGscPanel, SeoGeoPanel, SeoBrokenUrlsPanel,
} from "./seo-analytics-panels";

type NavId =
  | "overview" | "settings" | "pages" | "robots" | "sitemaps" | "schema"
  | "redirects" | "cannibalisation" | "visibility" | "gsc" | "geo" | "errors";

/** Sections whose header (breadcrumb + title + description) is rendered by the shell.
 * `overview`, `robots` and `sitemaps` render their own header/actions. */
const HEADS: Partial<Record<NavId, { crumb: string; title: string; description: string }>> = {
  settings: { crumb: "Global Defaults", title: "Global Defaults", description: "Site-wide title template, meta description and social sharing defaults." },
  pages: { crumb: "Pages", title: "Public Pages", description: "Every public page with its SEO score, views and per-page meta controls — click a title to open its SEO editor." },
  schema: { crumb: "Schema", title: "Structured Data", description: "JSON-LD schema blocks and their validation health." },
  redirects: { crumb: "Redirections", title: "Managed Redirects", description: "301/302 redirects for moved or retired URLs." },
  cannibalisation: { crumb: "Cannibalisation", title: "Keyword Cannibalisation", description: "Public URLs competing for the same primary keyword. Articles own informational phrasing; course pages own commercial phrasing." },
  visibility: { crumb: "Visibility", title: "Backlinks & Visibility", description: "Referring domains, anchors and link authority." },
  gsc: { crumb: "Google Search Console", title: "Search Console", description: "Clicks, impressions and query performance." },
  geo: { crumb: "Generative Engine Optimization", title: "AI Answer Engines", description: "Track how often your site is cited by AI answer engines." },
  errors: { crumb: "Crawl Errors", title: "Broken URLs", description: "404s and crawl errors to fix or redirect." },
};

const NAV: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "settings", label: "Global Defaults", icon: SlidersHorizontal },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "robots", label: "Robots", icon: Bot },
  { id: "sitemaps", label: "Sitemaps", icon: Map },
  { id: "schema", label: "Schema", icon: Braces },
  { id: "redirects", label: "Redirections", icon: Shuffle },
  { id: "cannibalisation", label: "Cannibalisation", icon: Split },
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "gsc", label: "GSC", icon: BarChart3 },
  { id: "geo", label: "GEO", icon: Globe },
  { id: "errors", label: "Errors", icon: TriangleAlert },
];

export function SeoManager({
  overview, settings, publicPages, redirects, schemas, schemaSummary, cannibalIssues,
}: {
  overview: SeoOverview;
  settings: SeoSettings;
  publicPages: SeoPublicPage[];
  redirects: SeoRedirect[];
  schemas: SeoSchema[];
  schemaSummary: SchemaSummary;
  cannibalIssues: CannibalIssue[];
}) {
  const [active, setActive] = React.useState<NavId>("overview");
  const head = HEADS[active];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* left nav */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="p-2">
            <nav className="space-y-0.5">
              {NAV.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                    active === s.id ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-muted",
                  )}
                >
                  <s.icon className="size-4 shrink-0" />
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      {/* active panel */}
      <div className="min-w-0 space-y-4">
        {head && <SeoPanelHead crumb={head.crumb} title={head.title} description={head.description} />}

        {active === "overview" && <SeoOverviewPanel overview={overview} settings={settings} />}
        {active === "settings" && <SeoSettingsPanel initial={settings} />}
        {active === "pages" && <SeoPagesPanel publicPages={publicPages} />}
        {active === "robots" && <SeoRobotsPanel initial={settings} />}
        {active === "sitemaps" && <SeoSitemapsPanel />}
        {active === "schema" && <SeoSchemaPanel initial={schemas} initialSummary={schemaSummary} />}
        {active === "redirects" && <SeoRedirectsPanel initial={redirects} />}
        {active === "cannibalisation" && <SeoCannibalisationPanel issues={cannibalIssues} />}
        {active === "visibility" && <SeoBacklinksPanel />}
        {active === "gsc" && <SeoGscPanel />}
        {active === "geo" && <SeoGeoPanel />}
        {active === "errors" && <SeoBrokenUrlsPanel />}
      </div>
    </div>
  );
}
