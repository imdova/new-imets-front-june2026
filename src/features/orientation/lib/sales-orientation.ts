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
 * The lessons, in order.
 *
 * `id` doubles as the URL hash and the key completion is stored under, so
 * renaming one resets that lesson for everyone and breaks any link a manager
 * has shared — treat these as stable identifiers rather than labels.
 *
 * `short` is the curriculum rail; `heading` is the lesson's own title, which is
 * allowed to be a full sentence.
 */
export const ORIENTATION_LESSONS = [
  {
    id: "contrast",
    short: "الفرق في ردّين",
    en: "The contrast",
    heading: "نفس العميل، ونفس البرنامج، وردّين مختلفين تمامًا",
    intro:
      "شغلك مش إنك تبعت تفاصيل الكورس. شغلك إنك تفهم العميل عايز إيه، وتساعده يقرر إن كان البرنامج ده مناسب لهدفه ولا لأ. بدّل بين الردّين وشوف الفرق.",
  },
  {
    id: "path",
    short: "مسار المحادثة",
    en: "Conversation path",
    heading: "مسار المحادثة من أولها لآخرها",
    intro:
      "ده الترتيب اللي بيخلي الحوار استشاري بدل ما يكون عرض كورسات وأسعار. لو اتخطّيت خطوة، غالبًا العميل هيقف عند «هفكر وأرد عليك».",
  },
  {
    id: "rules",
    short: "القواعد الأربع",
    en: "The four rules",
    heading: "القواعد الأربع",
    intro:
      "كل قاعدة فيها الغلط الشائع، الصح، والمعادلة اللي تحفظها. افتح القواعد الأربع كلها عشان تكمّل الدرس.",
  },
  {
    id: "practice",
    short: "تدريب",
    en: "Practice",
    heading: "تدريب: اختار الرد الأنسب",
    intro:
      "ستة مواقف حقيقية بتيجيلنا كل أسبوع. اختار ردًا واحدًا في كل موقف، وهيوصلك تعليق يوضح القاعدة اللي اتطبّقت.",
  },
  {
    id: "phrases",
    short: "بدائل آمنة",
    en: "Safer phrasing",
    heading: "جمل ممنوعة وبدائلها",
    intro:
      "الجمل دي بتوعد بحاجة مش تحت سيطرتنا، وبتفتح باب شكاوى واسترداد أموال بعدين. اقلب كل كارت تشوف الصياغة البديلة.",
  },
  {
    id: "closing",
    short: "صياغة الخطوة التالية",
    en: "Next step",
    heading: "صياغة الخطوة التالية",
    intro:
      "اختار حالة العميل، وهتلاقي صيغة إقفال جاهزة تعدّلها على كلامك. المهم إن كل محادثة تنتهي بسؤال، مش بـ«أنا موجود لو احتجت».",
  },
  {
    id: "checklist",
    short: "قبل الإرسال",
    en: "Before you send",
    heading: "قبل ما تبعت الرسالة",
    intro: "راجع الست نقاط دي على أي رد طويل قبل ما تضغط إرسال.",
  },
] as const;

export type LessonId = (typeof ORIENTATION_LESSONS)[number]["id"];
