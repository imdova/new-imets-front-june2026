"use client";

import * as React from "react";
import { ChevronDown, ArrowRight, Sparkles, Star, Users, Layers } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { useGeoCurrency, pickCourseMoney } from "@/hooks/use-geo-currency";

export interface MegaCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  price: number;
  salePrice: number;
  /** Geo pricing (SAR for Saudi visitors, USD elsewhere). 0 when not configured. */
  priceSAR?: number;
  salePriceSAR?: number;
  priceUSD?: number;
  salePriceUSD?: number;
  rating: number;
  students: number;
  isBestseller: boolean;
}

export interface MegaCategory {
  id: string;
  slug: string;
  name: string;
  count: number;
}

const tr = (locale: string, en: string, ar: string) => (locale === "ar" ? ar : en);

/**
 * "Browse Courses" mega menu.
 *
 * Data is fetched server-side in the public layout and passed down, so the panel
 * is fully populated on first paint — no spinner, no layout shift. Opens on
 * hover (with a close delay so the pointer can travel the gap) and on click/
 * keyboard for touch + a11y.
 */
export function CoursesMegaMenu({
  locale,
  label,
  categories,
  courses,
  active,
  onDark = false,
}: {
  locale: string;
  label: string;
  categories: MegaCategory[];
  courses: MegaCourse[];
  active?: boolean;
  /** The home header sits transparent over the hero — invert the trigger. */
  onDark?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const geoCurrency = useGeoCurrency();

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };
  React.useEffect(() => () => cancelClose(), []);

  // Esc closes; focus leaving the menu closes it (keyboard users).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The category being previewed — hovered, else the first one.
  const activeCat = hovered ?? categories[0]?.slug ?? null;
  const shown = React.useMemo(() => {
    const inCat = activeCat
      ? courses.filter((c) => c.category === categories.find((x) => x.slug === activeCat)?.name)
      : courses;
    return (inCat.length ? inCat : courses).slice(0, 3);
  }, [activeCat, courses, categories]);

  if (!categories.length && !courses.length) {
    return (
      <Link href="/courses" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        {label}
      </Link>
    );
  }

  return (
    <div
      ref={rootRef}
      className="static"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          onDark
            ? active || open
              ? "text-white"
              : "text-white/75 hover:text-white"
            : active || open
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Full-bleed panel. `static` parent + inset-x-0 keeps it edge-to-edge
          under the header instead of clipping to the trigger. */}
      <div
        className={cn(
          "absolute inset-x-0 top-full z-50 origin-top transition-all duration-200",
          open ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1",
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/98 shadow-2xl shadow-blue-950/10 backdrop-blur-xl ring-1 ring-black/5">
            <div className="grid lg:grid-cols-[minmax(0,17rem)_1fr]">
              {/* Categories rail */}
              <div className="border-b border-border/60 bg-muted/40 p-3 lg:border-b-0 lg:border-e">
                <p className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Layers className="size-3.5" /> {tr(locale, "Categories", "التصنيفات")}
                </p>
                <ul className="space-y-0.5">
                  {categories.map((c) => {
                    const isOn = activeCat === c.slug;
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/category/${c.slug}`}
                          onMouseEnter={() => setHovered(c.slug)}
                          onFocus={() => setHovered(c.slug)}
                          className={cn(
                            "group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            isOn ? "bg-background text-foreground shadow-sm ring-1 ring-border/60" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                          )}
                        >
                          <span className="truncate font-medium">{c.name}</span>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                              {c.count}
                            </span>
                            <ArrowRight className={cn("size-3.5 shrink-0 transition-all rtl:rotate-180", isOn ? "opacity-100" : "opacity-0 -translate-x-1")} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Course preview */}
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" /> {tr(locale, "Popular programs", "برامج مميزة")}
                  </p>
                  <Link href="/courses" className="group inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    {tr(locale, "View all courses", "عرض كل الكورسات")}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                  </Link>
                </div>

                <ul className="grid gap-3 sm:grid-cols-3">
                  {shown.map((c) => {
                    const money = pickCourseMoney(
                      geoCurrency,
                      { price: c.price, sale: c.salePrice },
                      { price: c.priceSAR ?? 0, sale: c.salePriceSAR ?? 0 },
                      { price: c.priceUSD ?? 0, sale: c.salePriceUSD ?? 0 },
                    );
                    const onSale = money.sale > 0 && money.sale < money.price;
                    const shownPrice = onSale ? money.sale : money.price;
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/courses/${c.slug}`}
                          className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                        >
                          <span className="relative block aspect-video overflow-hidden bg-muted">
                            {/* Decorative: this link already announces the
                                course title below, so alt text here would make
                                a screen reader read the same course twice.
                                aria-hidden makes that intent explicit rather
                                than leaving an empty alt to be read as an
                                oversight. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={c.thumbnailUrl}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {c.isBestseller && (
                              <span className="absolute start-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                                {tr(locale, "Bestseller", "الأكثر مبيعًا")}
                              </span>
                            )}
                          </span>
                          <span className="flex flex-1 flex-col p-3">
                            <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                              {c.title}
                            </span>
                            <span className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                              {c.rating > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="size-3 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold tabular-nums text-foreground">{c.rating.toFixed(1)}</span>
                                </span>
                              )}
                              {c.students > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="size-3" />
                                  <span className="tabular-nums">{c.students.toLocaleString()}</span>
                                </span>
                              )}
                            </span>
                            {shownPrice > 0 && (
                              <span className="mt-auto flex items-baseline gap-1.5 pt-2.5">
                                <span className="font-heading text-sm font-bold tabular-nums text-primary">
                                  {formatCurrency(shownPrice, money.currency)}
                                </span>
                                {onSale && (
                                  <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                                    {formatCurrency(money.price, money.currency)}
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
