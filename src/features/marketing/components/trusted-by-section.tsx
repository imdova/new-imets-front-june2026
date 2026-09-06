import Image from "next/image";
import {
  Star,
  Building2,
  Briefcase,
  BadgeCheck,
  UsersRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PARTNER_IMAGES } from "@/features/marketing/lib/partner-images";

const TRUST_GROUPS = [
  {
    key: "hospitals" as const,
    icon: Building2,
    items: [
      "King Faisal Specialist Hospital",
      "Cleveland Clinic Abu Dhabi",
      "Jordan University Hospital",
    ],
  },
  {
    key: "companies" as const,
    icon: Briefcase,
    items: [
      "Mediclinic Middle East",
      "Aster DM Healthcare",
    ],
  },
  {
    key: "accreditation" as const,
    icon: BadgeCheck,
    items: [
      "AIHCM · American Institute of Healthcare Management",
      "AGEPAA · American Group of Educational Projects Accreditation and Administration",
      "NAHQ · CPHQ",
    ],
  },
  {
    key: "associations" as const,
    icon: UsersRound,
    items: ["SCFHS", "DHA", "QCHP"],
  },
] as const;

/** Headline proof numbers. */
/* "4.9★" removed — no consented review is stored anywhere to average. */
const STATS = [
  { value: "18,000+", key: "trustedStatPros" },
  { value: "15+", key: "trustedStatCountries" },
  { value: "38+", key: "trustedStatFaculty" },
  { value: "64+", key: "trustedStatPrograms" },
] as const;

/**
 * Social-proof strip placed immediately under the home hero —
 * hospitals, employers, accreditations, and professional associations.
 */
export async function TrustedBySection() {
  const t = await getTranslations("Marketing");

  const labels = {
    hospitals: t("trustedGroupHospitals"),
    companies: t("trustedGroupCompanies"),
    accreditation: t("trustedGroupAccreditation"),
    associations: t("trustedGroupAssociations"),
  };

  return (
    <section className="border-b border-blue-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="flex justify-center gap-0.5 text-[#f4c430]"
            role="img"
            aria-label="5 out of 5 stars"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-5 fill-current" />
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b3fa8]">
            {t("trustedByLabel")}
          </p>
          <h2 className="mt-2 text-balance font-heading text-2xl font-bold tracking-tight text-[#0a2f7a] sm:text-3xl">
            {t("trustedByTitle")}
          </h2>
        </div>

        {/* Proof numbers */}
        <div className="mt-9 grid grid-cols-2 gap-4 rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-6 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
          {STATS.map((s) => (
            <div key={s.key} className="text-center">
              <p className="font-heading text-2xl font-extrabold tabular-nums text-[#0b3fa8] sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                {t(s.key)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_GROUPS.map((group) => (
            <div
              key={group.key}
              className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50/60 to-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-[#0b3fa8]/10 text-[#0b3fa8]">
                  <group.icon className="size-4" />
                </span>
                <h3 className="text-sm font-bold text-[#0a2f7a]">
                  {labels[group.key]}
                </h3>
              </div>
              <ul className="mt-4 space-y-2">
                {group.items.map((name) => {
                  const image = PARTNER_IMAGES[name];

                  return (
                    <li
                      key={name}
                      className="overflow-hidden rounded-lg border border-blue-50 bg-white shadow-sm"
                    >
                      {image ? (
                        <div className="relative aspect-[16/10] w-full bg-slate-50">
                          {/* Decorative: the name is already announced by the
                              <p> below, so alt text here would repeat it. */}
                          <Image
                            src={image.src}
                            alt=""
                            fill
                            sizes="(max-width: 1024px) 50vw, 200px"
                            className={
                              image.objectFit === "contain"
                                ? "object-contain p-3"
                                : "object-cover"
                            }
                            style={
                              image.objectPosition
                                ? { objectPosition: image.objectPosition }
                                : undefined
                            }
                          />
                        </div>
                      ) : null}
                      <p className="px-3 py-2 text-center text-xs font-semibold text-slate-600">
                        {name}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
