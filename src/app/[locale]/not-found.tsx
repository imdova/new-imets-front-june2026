import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import { SITE_NAME } from "@/lib/seo";

/**
 * 404 boundary for routes that exist but call `notFound()` — an unknown course
 * slug, a deleted article, a category that never existed.
 *
 * Without this file Next has no boundary to render between the thrown
 * `notFound()` and the root, so it rendered the locale layout around *empty
 * children*: a 215KB response with the site chrome, correct `noindex`, and not
 * one word of visible text. Worse than the framework's own 404, because it
 * looked like the page had loaded and then failed.
 *
 * `global-not-found.tsx` does not cover this. That one handles URLs matching no
 * route at all (`/cphq-study-videos`), where the `[locale]` segment never
 * resolves and its layout never runs. This one handles a matched route that
 * decided its content does not exist — which is every dynamic public page:
 * `/courses/[slug]`, `/blog/[slug]`, `/category/[slug]`, `/instructors/[id]`.
 *
 * It also catches `requirePermission()`, which throws `notFound()` for a denied
 * staff member (see the auth notes in CLAUDE.md) — they were getting the same
 * blank screen.
 */

export const metadata: Metadata = {
  title: { absolute: `404 — Page not found · ${SITE_NAME}` },
  robots: { index: false, follow: true },
};

export default async function LocaleNotFound() {
  /*
   * A not-found boundary receives no `params`. The locale layout has normally
   * already called `setRequestLocale`, so this resolves — but it is not
   * guaranteed on every path into this component, and a 404 page that throws is
   * a 500. English is the site default, so it is the right fallback.
   */
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // keep the default
  }
  const ar = locale === "ar";
  const prefix = ar ? "/ar" : "";

  const links = [
    { href: `${prefix}/`, label: ar ? "الرئيسية" : "Home" },
    { href: `${prefix}/courses`, label: ar ? "الكورسات" : "Courses" },
    { href: `${prefix}/blog`, label: ar ? "المدونة" : "Blog" },
    { href: `${prefix}/contact`, label: ar ? "تواصل معنا" : "Contact" },
  ];

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {ar ? "الصفحة غير موجودة" : "This page could not be found"}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
        {ar
          ? "الرابط الذي فتحته غير صحيح، أو أن الصفحة نُقلت أو حُذفت. جرّب البدء من أحد الروابط التالية."
          : "The link may be mistyped, or the page has moved or been removed. Try one of these instead."}
      </p>

      {/*
        A 404 outside the marketing shell has no header to navigate from, so it
        carries its own routes out. A dead end is how a 404 turns a lost visitor
        into a bounce.
      */}
      <nav className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={
              i === 0
                ? "rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                : "rounded-xl border border-border/70 px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
            }
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
