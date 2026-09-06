import { AlertTriangle, ArrowLeftRight, CheckCircle2, ExternalLink, Tag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeoStatCard } from "./seo-stat-card";
import type { CannibalIssue, KeywordTarget } from "../lib/cannibalisation";

function TargetLine({ t }: { t: KeywordTarget }) {
  return (
    <div className="min-w-0">
      <a
        href={t.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <span className="truncate">{t.url}</span>
        <ExternalLink className="size-3.5 shrink-0" />
      </a>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.title}</p>
      <Badge variant="outline" className="mt-1.5 text-[10px] uppercase">
        {t.kind === "course" ? "Commercial" : "Informational"}
      </Badge>
    </div>
  );
}

/**
 * Read-only report. The fix for a keyword collision is always editorial —
 * retitle, consolidate, or redirect — so this names the conflict and the
 * recommended resolution and leaves the decision with the editor.
 */
export function SeoCannibalisationPanel({ issues }: { issues: CannibalIssue[] }) {
  const high = issues.filter((i) => i.severity === "high").length;
  const pairs = issues.filter((i) => i.kind === "duplicate-keyword").length;
  const intent = issues.filter((i) => i.kind === "commercial-intent").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <SeoStatCard
          label="Conflicts"
          value={String(issues.length)}
          icon={AlertTriangle}
          tint={issues.length ? "amber" : "emerald"}
        />
        <SeoStatCard label="Competing URL pairs" value={String(pairs)} icon={ArrowLeftRight} tint="rose" />
        <SeoStatCard label="Intent mismatches" value={String(intent)} icon={Tag} tint="violet" />
      </div>

      {issues.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <CheckCircle2 className="size-5 text-emerald-600" />
            No two public URLs are targeting the same primary keyword.
          </CardContent>
        </Card>
      ) : (
        <>
          {high > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{high}</span> conflict
              {high === 1 ? "" : "s"} involve a course page — those cost conversions, not just
              positions, so resolve them first.
            </p>
          )}

          <div className="space-y-3">
            {issues.map((issue, i) => (
              <Card key={`${issue.a.url}-${issue.b?.url ?? issue.kind}-${i}`}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>
                      {issue.severity === "high" ? "High" : "Medium"}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {issue.kind === "duplicate-keyword" ? "Same primary keyword" : "Commercial phrasing in an article"}
                    </span>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{issue.phrase}</code>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
                    <TargetLine t={issue.a} />
                    {issue.b && (
                      <>
                        <ArrowLeftRight className="mt-1 hidden size-4 text-muted-foreground sm:block" />
                        <TargetLine t={issue.b} />
                      </>
                    )}
                  </div>

                  <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    {issue.fix}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
