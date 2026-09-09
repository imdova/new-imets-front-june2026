import content from "../content/sales-orientation.json";

/**
 * Sales-team orientation content.
 *
 * The copy is Egyptian Arabic and stays that way regardless of the console's
 * UI language: it is scripted dialogue for a team that sells in Arabic, and
 * translating a WhatsApp reply would destroy the thing being taught. Only the
 * surrounding chrome follows the admin locale.
 *
 * Held as JSON rather than inlined in the components so the team can revise the
 * wording without touching the interaction code — every module below is driven
 * entirely by this file, including how many steps and scenarios exist.
 */

export type Side = "client" | "rep";

export interface ThreadMessage {
  from: Side;
  who: string;
  text: string;
}

export interface Thread {
  messages: ThreadMessage[];
  verdict: { tone: "good" | "bad"; lead: string; rest: string };
}

export interface PathStep {
  /** Arabic-Indic numeral, as written in the source. */
  n: string;
  title: string;
  body: string;
}

export interface RuleLine {
  side: Side;
  text: string;
}

export interface Rule {
  id: string;
  title: string;
  /** English gloss, shown as a subtitle. */
  en: string;
  intro: string;
  bad: RuleLine[];
  good: RuleLine[];
  /** The memorable shape of the rule, e.g. "سؤال ← قيمة ← سؤال". */
  formula: string;
  note: string;
  /** Feature words the rule warns against leading with. Empty for most rules. */
  chips: string[];
}

export interface ScenarioOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface Scenario {
  /** Which rule(s) the scenario exercises, e.g. "R1" or "R1 + R4". */
  tag: string;
  message: string;
  options: ScenarioOption[];
}

export interface SalesOrientation {
  threads: { bad: Thread; good: Thread };
  steps: PathStep[];
  rules: Rule[];
  scenarios: Scenario[];
  phraseBank: { risky: string; safe: string }[];
  closings: { situation: string; text: string }[];
  checklist: { question: string; hint: string }[];
}

export const SALES_ORIENTATION = content as SalesOrientation;

/**
 * The modules a new joiner works through, in order.
 *
 * `id` doubles as the scroll anchor and the key under which completion is
 * stored, so renaming one resets that module for everyone — treat these as
 * stable identifiers rather than labels.
 */
export const ORIENTATION_MODULES = [
  { id: "contrast", title: "الفرق في ردّين", en: "The contrast" },
  { id: "path", title: "مسار المحادثة", en: "Conversation path" },
  { id: "rules", title: "القواعد الأربع", en: "The four rules" },
  { id: "practice", title: "تدريب", en: "Practice" },
  { id: "phrases", title: "بدائل آمنة", en: "Safer phrasing" },
  { id: "closing", title: "صياغة الخطوة التالية", en: "Next step" },
  { id: "checklist", title: "قبل الإرسال", en: "Before you send" },
] as const;

export type ModuleId = (typeof ORIENTATION_MODULES)[number]["id"];
