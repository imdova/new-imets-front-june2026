import { getTranslations, setRequestLocale } from "next-intl/server";

import { dal } from "@/lib/dal";
import { PageHeader } from "@/components/shared/page-header";
import { SalesOrientation } from "@/features/orientation/components/sales-orientation";
import {
  SALES_ORIENTATION,
  type ProgrammeNumbers,
} from "@/features/orientation/lib/sales-orientation";

export const metadata = { robots: { index: false } };

export default async function OrientationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");

  /*
   * The programme-numbers lesson quotes fees, lecture counts and learner totals.
   * They are resolved from the live course records rather than copied into the
   * training content, so changing a price in Admin → Courses updates what reps
   * are taught to quote. A programme whose course is missing or unpublished is
   * dropped rather than shown with a stale or empty price.
   */
  const res = await dal.courses.fetchCourses();
  const courses = res.ok ? res.data : [];
  const programmes: ProgrammeNumbers[] = SALES_ORIENTATION.programmes
    .map((ref) => {
      const c = courses.find((x) => x.slug === ref.slug);
      if (!c || c.status !== "published" || c.priceEGP <= 0) return null;
      return {
        ...ref,
        lectures: c.lectures,
        price: c.priceEGP,
        sale: c.salePriceEGP > 0 ? c.salePriceEGP : c.priceEGP,
        students: c.students,
      };
    })
    .filter((p): p is ProgrammeNumbers => p !== null);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/*
        The header follows the console's language; everything below it is the
        Arabic training content, which stays Arabic in both locales — see the
        note in `sales-orientation.tsx`.
      */}
      <PageHeader
        title={t("salesOrientation")}
        description={t("salesOrientationDesc")}
      />
      <SalesOrientation programmes={programmes} />
    </div>
  );
}
