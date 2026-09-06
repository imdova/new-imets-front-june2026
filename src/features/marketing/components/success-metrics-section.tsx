import { getTranslations } from "next-intl/server";

/*
 * The "4.9" rating was removed: the platform stores zero consented reviews, so
 * there is no rating to average. Displaying one is the same fabrication that
 * was stripped from the course and category pages, and a star figure nobody
 * gave is the kind of claim that costs more than it earns.
 *
 * The remaining figures are institution-wide business numbers that only the
 * school can verify. `metricPassRate` in particular asserts an outcome — the
 * backend already refuses to publish a course pass rate without a stored basis
 * (see CoursesService.validateClaims); this one is not held to that yet.
 */
const METRICS = [
  { value: "18,000+", labelKey: "metricProfessionals" },
  { value: "92%", labelKey: "metricPassRate" },
  { value: "50+", labelKey: "metricNationalities" },
  { value: "15+", labelKey: "metricCountries" },
  { value: "120+", labelKey: "metricClients" },
] as const;

export async function SuccessMetricsSection() {
  const t = await getTranslations("Marketing");

  return (
    <section className="border-y border-blue-100 bg-gradient-to-b from-white to-blue-50/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0b3fa8]">
            {t("metricsLabel")}
          </p>
          <h2 className="mt-2 text-balance font-heading text-2xl font-bold tracking-tight text-[#0a2f7a] sm:text-3xl lg:text-[2rem]">
            {t("metricsTitle")}
          </h2>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            {t("metricsSubtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((metric) => (
            <article
              key={metric.labelKey}
              className="rounded-3xl border border-blue-100 bg-white p-7 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#0b3fa8]/35 hover:shadow-md"
            >
              <p className="font-heading text-4xl font-extrabold tracking-tight text-[#0b3fa8] sm:text-5xl">
                {metric.value}
              </p>
              <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500 sm:text-base sm:normal-case sm:tracking-normal">
                {t(metric.labelKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
