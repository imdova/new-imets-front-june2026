import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/shared/page-header";
import { SalesOrientation } from "@/features/orientation/components/sales-orientation";

export const metadata = { robots: { index: false } };

export default async function OrientationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Nav");

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
      <SalesOrientation />
    </div>
  );
}
