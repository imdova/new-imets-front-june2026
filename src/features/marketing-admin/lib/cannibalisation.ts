/**
 * Keyword-cannibalisation guard.
 *
 * Two of our own URLs chasing one query is a self-inflicted ranking problem:
 * Google picks one, the other's links and impressions are wasted, and which one
 * it picks is not the one we would choose. With 48 posts feeding 10 course
 * pages, the risk is structural rather than occasional.
 *
 * The division of labour this checks for: **posts own informational phrasing**
 * ("what is CPHQ", "how to prepare"), **course pages own commercial phrasing**
 * ("CPHQ course", "diploma fees"). A post that reaches for the commercial
 * phrase competes with the page that is meant to convert.
 *
 * Nothing here writes anything. It reports pairs for a human to resolve —
 * retitle, consolidate, or redirect — because the right fix is editorial.
 */

export type TargetKind = "course" | "post";

export interface KeywordTarget {
  /** Locale-independent path, e.g. "/courses/cphq-preparation". */
  url: string;
  kind: TargetKind;
  /** The phrase this URL actually targets — its SEO title, else its title. */
  title: string;
}

export interface CannibalIssue {
  severity: "high" | "medium";
  kind: "duplicate-keyword" | "commercial-intent";
  /** The overlapping terms, or the commercial term that leaked into a post. */
  phrase: string;
  a: KeywordTarget;
  b?: KeywordTarget;
  fix: string;
}

/**
 * Words that carry no targeting signal. Deliberately keeps "guide", "how" and
 * "what" OUT of the keyword set but they are still visible to the intent check
 * below, which reads the untrimmed title.
 */
const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "to", "in", "on", "of", "with", "your", "you", "our",
  "is", "are", "be", "how", "what", "why", "when", "which", "who", "do", "does", "can",
  "best", "top", "complete", "ultimate", "full", "guide", "step", "steps", "tips", "vs",
  "imets", "medical", "school", "academy", "2024", "2025", "2026", "2027",
  "في", "من", "على", "عن", "الى", "إلى", "ما", "هو", "هي", "كيف", "لماذا", "دليل", "أفضل", "شرح",
]);

/** Terms that mark a page as commercial rather than informational. */
const COMMERCIAL = [
  // "program"/"programme" are deliberately absent: in healthcare they usually
  // mean a clinical programme ("infection prevention and control program"),
  // which would flag legitimate articles.
  "course", "courses", "training", "diploma", "diplomas",
  "price", "prices", "pricing", "fee", "fees", "cost", "enroll", "enrol", "enrolment",
  "enrollment", "register", "registration", "apply", "admission",
  "دورة", "دورات", "تدريب", "دبلوم", "دبلومة", "سعر", "أسعار", "رسوم", "تسجيل", "التحاق",
];

/** Lowercase, drop Arabic diacritics and punctuation, collapse whitespace. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/[|–—\-–—:,.()"'’“”/\\[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The significant terms a URL targets. */
function keywordTokens(title: string): Set<string> {
  return new Set(
    normalise(title)
      .split(" ")
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/**
 * Containment, not Jaccard: "CPHQ exam preparation" fully inside "CPHQ exam
 * preparation for healthcare quality professionals" is a real collision even
 * though the longer title dilutes a symmetric score below any useful threshold.
 */
function containment(a: Set<string>, b: Set<string>): number {
  const smaller = a.size <= b.size ? a : b;
  const larger = smaller === a ? b : a;
  let shared = 0;
  for (const w of smaller) if (larger.has(w)) shared++;
  return smaller.size === 0 ? 0 : shared / smaller.size;
}

function sharedTerms(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((w) => b.has(w));
}

/** Overlap at or above this is treated as the same primary keyword. */
const OVERLAP_THRESHOLD = 0.8;
/** Below this many significant terms a title is too thin to compare. */
const MIN_TOKENS = 2;

export function findCannibalisation(targets: KeywordTarget[]): CannibalIssue[] {
  const issues: CannibalIssue[] = [];
  const tokens = new Map<string, Set<string>>();
  for (const t of targets) tokens.set(t.url, keywordTokens(t.title));

  /* 1 — two URLs targeting the same primary keyword. */
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i];
      const b = targets[j];
      const ta = tokens.get(a.url)!;
      const tb = tokens.get(b.url)!;
      if (ta.size < MIN_TOKENS || tb.size < MIN_TOKENS) continue;
      if (containment(ta, tb) < OVERLAP_THRESHOLD) continue;

      const crossKind = a.kind !== b.kind;
      issues.push({
        // A post competing with the course page it should be feeding costs a
        // conversion, not just a position — that outranks post-vs-post overlap.
        severity: crossKind || a.kind === "course" ? "high" : "medium",
        kind: "duplicate-keyword",
        phrase: sharedTerms(ta, tb).join(" "),
        a,
        b,
        fix: crossKind
          ? "Retitle the article to the informational angle and let the course page keep the commercial phrase."
          : "Consolidate into one page and 301 the weaker URL, or retitle one to a distinct angle.",
      });
    }
  }

  /* 2 — an article reaching for commercial phrasing the course page owns. */
  for (const t of targets) {
    if (t.kind !== "post") continue;
    const words = new Set(normalise(t.title).split(" "));
    const hit = COMMERCIAL.find((w) => words.has(w));
    if (!hit) continue;
    // Already reported above as a concrete pair — no need to say it twice.
    if (issues.some((i) => i.a.url === t.url || i.b?.url === t.url)) continue;
    issues.push({
      severity: "medium",
      kind: "commercial-intent",
      phrase: hit,
      a: t,
      fix: `"${hit}" is commercial phrasing that belongs to a course page. Rephrase the article title to the question it answers.`,
    });
  }

  return issues.sort((x, y) => (x.severity === y.severity ? 0 : x.severity === "high" ? -1 : 1));
}
