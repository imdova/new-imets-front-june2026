#!/usr/bin/env node
/**
 * Crawl every URL in the sitemap index and report metadata + image problems.
 *
 * Both halves of this exist because the alternative is spot-checking by eye,
 * which is how a site ends up believing "3 of 11 images on one page" is the
 * whole problem. It reads the rendered HTML, so it sees what a crawler sees
 * rather than what the source implies.
 *
 * Usage:
 *   node scripts/audit-seo.mjs                       # against production
 *   node scripts/audit-seo.mjs --base http://localhost:3000
 *   node scripts/audit-seo.mjs --limit 20            # quick pass
 *   node scripts/audit-seo.mjs --json report.json    # machine-readable
 *
 * Exit code is 1 when any hard failure is found, so it can gate a deploy.
 */
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = argOf("--base", "https://imetsedu.com").replace(/\/$/, "");
const LIMIT = Number(argOf("--limit", "0")) || Infinity;
const JSON_OUT = argOf("--json", "");
const CONCURRENCY = Number(argOf("--concurrency", "6"));

/** Google truncates around here; these are the ticket's limits. */
const TITLE_MAX = 60;
const DESC_MAX = 155;
const BRAND = "IMETS";

/* ── tiny HTML helpers (no dependencies) ─────────────────────────────────── */

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

const head = (html) => html.split(/<\/head>/i)[0] ?? "";
const body = (html) => html.split(/<body[^>]*>/i)[1] ?? html;

function metaContent(html, attr, value) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*>`, "i");
  const tag = head(html).match(re)?.[0];
  return tag ? decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "") : "";
}

/** Attributes of one tag, lowercased keys. */
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)(?:=["']([^"']*)["'])?/g)) {
    if (m[1] && m[1].toLowerCase() !== "img") out[m[1].toLowerCase()] = m[2] ?? "";
  }
  return out;
}

/* ── fetching ────────────────────────────────────────────────────────────── */

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": "imets-seo-audit" } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

async function sitemapUrls() {
  const index = await get(`${BASE}/sitemap.xml`);
  const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = new Set();
  for (const child of children) {
    // Rewrite to the base being audited so a local run does not fetch production.
    const local = child.replace(/^https?:\/\/[^/]+/, BASE);
    const xml = await get(local);
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urls.add(m[1].replace(/^https?:\/\/[^/]+/, BASE));
    }
  }
  return [...urls];
}

/** Run `fn` over `items` with bounded concurrency, preserving order. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/* ── per-page inspection ─────────────────────────────────────────────────── */

function inspect(url, html) {
  const title = decode(head(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "");
  const description = metaContent(html, "name", "description");

  const issues = [];

  if (!title) issues.push({ level: "error", kind: "title-missing", detail: "no <title>" });
  else if (title.length > TITLE_MAX)
    issues.push({ level: "warn", kind: "title-long", detail: `${title.length} chars` });

  if (!description) issues.push({ level: "error", kind: "description-missing", detail: "" });
  else if (description.length > DESC_MAX)
    issues.push({ level: "warn", kind: "description-long", detail: `${description.length} chars` });

  /*
   * Doubled brand: the layout template appends "· IMETS Medical School" to
   * whatever a page supplies, so a page whose own title already names IMETS
   * ships it twice.
   */
  const brandCount = (title.match(new RegExp(BRAND, "gi")) ?? []).length;
  if (brandCount > 1)
    issues.push({ level: "error", kind: "brand-doubled", detail: `"${title}"` });

  /* Social metadata. */
  const og = {
    title: metaContent(html, "property", "og:title"),
    description: metaContent(html, "property", "og:description"),
    image: metaContent(html, "property", "og:image"),
  };
  const twitterCard = metaContent(html, "name", "twitter:card");
  if (!og.title) issues.push({ level: "warn", kind: "og-title-missing", detail: "" });
  if (!og.image) issues.push({ level: "warn", kind: "og-image-missing", detail: "" });
  else if (!/^https?:\/\//i.test(og.image))
    issues.push({ level: "error", kind: "og-image-relative", detail: og.image });
  if (!twitterCard) issues.push({ level: "warn", kind: "twitter-card-missing", detail: "" });

  /* Images. */
  const imgs = [...body(html).matchAll(/<img\b[^>]*>/gi)].map((m) => attrs(m[0]));
  let missingAlt = 0;
  let decorative = 0;
  let rawImg = 0;
  let priority = 0;
  const altSamples = [];

  for (const img of imgs) {
    const src = img.src ?? "";
    // Tracking pixels are not content and have no accessible role to play.
    const isPixel = /facebook\.com\/tr|google-analytics|gtag|\/pixel/i.test(src);
    if (isPixel) continue;

    if (!("alt" in img)) missingAlt++;
    else if (img.alt.trim() === "") decorative++;
    else altSamples.push({ alt: img.alt, src });

    // next/image rewrites through the optimizer; anything else is a raw <img>.
    if (src && !src.startsWith("/_next/image") && !src.startsWith("data:")) rawImg++;
    if (img.fetchpriority === "high" || (img.loading === "eager" && img.fetchpriority !== "low")) priority++;
  }

  if (missingAlt > 0)
    issues.push({ level: "error", kind: "img-alt-missing", detail: `${missingAlt} image(s) with no alt attribute` });
  if (priority > 1)
    issues.push({ level: "warn", kind: "priority-multiple", detail: `${priority} eager/high-priority images` });

  /*
   * Keyword stuffing: the same token repeated three or more times inside one
   * alt string is describing a search query, not a picture.
   */
  for (const { alt } of altSamples) {
    const words = alt.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    const counts = {};
    for (const w of words) if (w.length > 2) counts[w] = (counts[w] ?? 0) + 1;
    const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (worst && worst[1] >= 3)
      issues.push({ level: "warn", kind: "alt-keyword-stuffed", detail: `"${alt}"` });
  }

  return {
    url,
    title,
    description,
    og,
    twitterCard,
    images: { total: imgs.length, missingAlt, decorative, rawImg, priority },
    altSamples,
    issues,
  };
}

/* ── run ─────────────────────────────────────────────────────────────────── */

const urls = (await sitemapUrls()).slice(0, LIMIT);
console.log(`Auditing ${urls.length} URL(s) from ${BASE}/sitemap.xml\n`);

const pages = await mapLimit(urls, CONCURRENCY, async (url) => {
  try {
    return inspect(url, await get(url));
  } catch (err) {
    return {
      url,
      title: "",
      description: "",
      issues: [{ level: "error", kind: "fetch-failed", detail: String(err.message ?? err) }],
      images: { total: 0, missingAlt: 0, decorative: 0, rawImg: 0, priority: 0 },
      altSamples: [],
    };
  }
});

/* Duplicates — across the whole set, not per page. */
const byTitle = new Map();
const byDesc = new Map();
for (const p of pages) {
  if (p.title) byTitle.set(p.title, [...(byTitle.get(p.title) ?? []), p.url]);
  if (p.description) byDesc.set(p.description, [...(byDesc.get(p.description) ?? []), p.url]);
}
const dupTitles = [...byTitle.entries()].filter(([, u]) => u.length > 1);
const dupDescs = [...byDesc.entries()].filter(([, u]) => u.length > 1);

const errors = pages.flatMap((p) => p.issues.filter((i) => i.level === "error").map((i) => ({ ...i, url: p.url })));
const warns = pages.flatMap((p) => p.issues.filter((i) => i.level === "warn").map((i) => ({ ...i, url: p.url })));

const byKind = (list) =>
  Object.entries(
    list.reduce((acc, i) => ({ ...acc, [i.kind]: [...(acc[i.kind] ?? []), i] }), {}),
  ).sort((a, b) => b[1].length - a[1].length);

console.log("── Summary ──");
console.log(`  pages            ${pages.length}`);
console.log(`  errors           ${errors.length}`);
console.log(`  warnings         ${warns.length}`);
console.log(`  duplicate titles ${dupTitles.length}`);
console.log(`  duplicate descs  ${dupDescs.length}`);
console.log(`  images           ${pages.reduce((n, p) => n + p.images.total, 0)}`);
console.log(`  missing alt      ${pages.reduce((n, p) => n + p.images.missingAlt, 0)}`);
console.log(`  alt="" (declared decorative — verify by hand) ${pages.reduce((n, p) => n + p.images.decorative, 0)}`);
console.log(`  raw <img> (not next/image) ${pages.reduce((n, p) => n + p.images.rawImg, 0)}`);

for (const [label, list] of [["ERRORS", errors], ["WARNINGS", warns]]) {
  if (!list.length) continue;
  console.log(`\n── ${label} ──`);
  for (const [kind, items] of byKind(list)) {
    console.log(`\n  ${kind} (${items.length})`);
    for (const i of items.slice(0, 12)) {
      console.log(`    ${i.url.replace(BASE, "")}${i.detail ? ` — ${i.detail}` : ""}`);
    }
    if (items.length > 12) console.log(`    …and ${items.length - 12} more`);
  }
}

if (dupTitles.length) {
  console.log("\n── DUPLICATE TITLES ──");
  for (const [title, list] of dupTitles.slice(0, 15)) {
    console.log(`\n  "${title}"`);
    for (const u of list) console.log(`    ${u.replace(BASE, "")}`);
  }
}
if (dupDescs.length) {
  console.log("\n── DUPLICATE DESCRIPTIONS ──");
  for (const [desc, list] of dupDescs.slice(0, 15)) {
    console.log(`\n  "${desc.slice(0, 90)}…" (${list.length} pages)`);
    for (const u of list.slice(0, 6)) console.log(`    ${u.replace(BASE, "")}`);
  }
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, pages, dupTitles, dupDescs }, null, 2));
  console.log(`\nWrote ${JSON_OUT}`);
}

process.exit(errors.length || dupTitles.length ? 1 : 0);
