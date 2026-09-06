#!/usr/bin/env node
/**
 * Doorway-page guard for the country landing pages.
 *
 * A geo page that differs from its siblings only by a place name is a doorway
 * page under Google's spam policies, and the damage is site-wide rather than
 * limited to the offending URL. The rule is easy to state and easy to violate
 * six months from now by copying `egypt.json` and find-replacing "Egypt", so it
 * is checked mechanically rather than by eye:
 *
 *   1. every locale of every country carries at least MIN_WORDS words;
 *   2. no two countries' pages are more alike than MAX_SIMILARITY.
 *
 * Similarity is trigram-shingle Jaccard over the page's prose. Word-frequency
 * comparison is not enough here — two pages built from the same template share
 * whole sentences, and shingles catch that where a bag of words does not.
 *
 * Runs on `prebuild`, so a copy-paste country cannot reach production.
 * Run directly with `npm run check:geo`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "features",
  "marketing",
  "content",
  "geo",
);

const MIN_WORDS = 600;
/**
 * Two independently written pages on the same subject land around 0.10–0.15:
 * they share the credential's vocabulary and little else. Anything at 0.35 is
 * sharing sentences, not just terminology.
 */
const MAX_SIMILARITY = 0.35;
const SHINGLE = 3;

const LOCALES = ["en", "ar"];

/** All prose a reader actually sees, as one string. */
function prose(locale) {
  const parts = [
    locale.h1,
    locale.intro,
    ...locale.sections.flatMap((s) => [s.heading, ...s.paragraphs]),
    ...locale.faqs.flatMap((f) => [f.q, f.a]),
    locale.ctaHeading,
    locale.ctaBody,
  ];
  return parts.join(" ");
}

/**
 * Word split that works for Arabic as well as English. Splitting on whitespace
 * alone counts punctuation as letters; `\p{L}` keeps it to actual words.
 */
function words(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function shingles(text) {
  const w = words(text);
  const out = new Set();
  for (let i = 0; i + SHINGLE <= w.length; i++) out.add(w.slice(i, i + SHINGLE).join(" "));
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / (a.size + b.size - shared);
}

const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.log("check:geo — no country pages registered, nothing to check.");
  process.exit(0);
}

const pages = files.map((f) => JSON.parse(readFileSync(join(CONTENT_DIR, f), "utf8")));
const errors = [];

/* 1 — enough unique content to justify the page existing at all. */
for (const page of pages) {
  for (const locale of LOCALES) {
    const content = page[locale];
    if (!content) {
      errors.push(`${page.country}: missing "${locale}" content`);
      continue;
    }
    const count = words(prose(content)).length;
    if (count < MIN_WORDS) {
      errors.push(
        `${page.country} [${locale}]: ${count} words, needs ${MIN_WORDS}. ` +
          `Write real local content or delete the page — a thin geo page hurts the whole site.`,
      );
    } else {
      console.log(`  ok  ${page.country} [${locale}] — ${count} words`);
    }
  }
}

/* 2 — countries must not be each other's template. */
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    for (const locale of LOCALES) {
      const a = pages[i][locale];
      const b = pages[j][locale];
      if (!a || !b) continue;
      const score = jaccard(shingles(prose(a)), shingles(prose(b)));
      const label = `${pages[i].country} vs ${pages[j].country} [${locale}]`;
      if (score > MAX_SIMILARITY) {
        errors.push(
          `${label}: ${(score * 100).toFixed(1)}% similar, limit ${(MAX_SIMILARITY * 100).toFixed(0)}%. ` +
            `These read as one template with the country swapped.`,
        );
      } else {
        console.log(`  ok  ${label} — ${(score * 100).toFixed(1)}% similar`);
      }
    }
  }
}

if (pages.length === 1) {
  console.log("  note  one country registered — the similarity check activates with the second.");
}

if (errors.length) {
  console.error("\ncheck:geo FAILED\n");
  for (const e of errors) console.error(`  - ${e}`);
  console.error("");
  process.exit(1);
}

console.log("check:geo passed.");
