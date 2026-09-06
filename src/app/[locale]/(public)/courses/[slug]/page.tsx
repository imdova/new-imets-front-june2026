import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  BarChart3,
  PlayCircle,
  Globe,
  CalendarDays,
  Award,
  Infinity as InfinityIcon,
  ChevronRight,
  Star,
  CheckCircle2,
  Flame,
  MapPin,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { dal } from "@/lib/dal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/features/marketing/components/course-card";
import { CourseHeroMeta } from "@/features/marketing/components/course-hero-meta";
import { CourseCurriculum } from "@/features/marketing/components/course-curriculum";
import { CourseWhatYouLearn } from "@/features/marketing/components/course-what-you-learn";
import { CourseWhoShouldAttend, parseAudienceItems } from "@/features/marketing/components/course-who-should-attend";
import { CourseAudienceCards } from "@/features/marketing/components/course-audience-cards";
import { CourseApplyDialog } from "@/features/marketing/components/course-apply-dialog";
import { CourseSectionNav } from "@/features/marketing/components/course-section-nav";
import {
  CourseCareerGrowth,
  CourseWhyThisDiploma,
  CourseFinalCta,
  CourseSeoContent,
  CourseInstructor,
  CourseLearningExperience,
  CourseReviews,
  CourseTrustBar,
  CourseSectionBand,
  CourseFaq,
  CourseKnowledgeCenter,
  CoursePullQuote,
} from "@/features/marketing/components/course-detail-sections";
import { CourseKnowledgeArticles } from "@/features/marketing/components/course-knowledge-articles";
import {
  geoCoursePagesFor,
  geoContent,
  geoCoursePath,
} from "@/features/marketing/lib/geo-course-pages";
import { CourseAbout } from "@/features/marketing/components/course-about";
import { buildCourseAbout } from "@/features/marketing/lib/course-about";
import {
  getCourseContent,
  ratingDistribution,
  resolveModuleOutcomes,
  resolveModuleTopics,
} from "@/features/marketing/lib/course-content";
import { resolveModuleDetail } from "@/features/marketing/lib/hospital-curriculum";
import { CoursePrice } from "@/features/marketing/components/course-price";
import { YouTubePlayer } from "@/features/marketing/components/youtube-player";
import { WhatsAppFab } from "@/features/marketing/components/whatsapp-fab";
import { extractYouTubeVideoId } from "@/features/marketing/lib/youtube-id";
import { JsonLd } from "@/components/seo/json-ld";
import {
  SITE_NAME,
  localeUrl,
  seoAlternates,
  socialMeta,
  metaDescription,
  courseLd,
  courseVideoLd,
  breadcrumbLd,
  isoWeeks,
  offerPriceValidUntil,
} from "@/lib/seo";
import { mergeSeo } from "@/lib/public-seo";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const res = await dal.courses.fetchCourses();
  const course = (res.ok ? res.data : []).find((c) => c.slug === slug);
  if (!course) return {};
  const ar = locale === "ar";
  const courseName = ar ? course.titleAr : course.titleEn;
  const pageSeo = getCourseContent({
    slug: course.slug,
    titleEn: course.titleEn,
    titleAr: course.titleAr,
    locale,
  }).pageSeo;
  // Precedence: the admin SEO panel wins, then the bundled pageSeo, then the
  // course name/description. It used to be the other way round, which made the
  // SEO panel silently dead on exactly the courses that had bundled copy — an
  // admin could edit the meta title and see no change, with nothing to explain it.
  const seo = course.seo;
  const adminTitle = ar ? seo?.metaTitleAr : seo?.metaTitleEn;
  const bundledTitle = ar ? pageSeo?.metaTitleAr : pageSeo?.metaTitleEn;
  const title = adminTitle || bundledTitle || courseName;
  const description =
    (ar ? seo?.metaDescriptionAr : seo?.metaDescriptionEn) ||
    (ar ? pageSeo?.metaDescriptionAr : pageSeo?.metaDescriptionEn) ||
    metaDescription(
      ar ? course.descriptionAr : course.descriptionEn,
      `${courseName} — ${SITE_NAME}`,
    );
  const keywords = (ar ? seo?.metaKeywordsAr : seo?.metaKeywordsEn) ?? [];
  const path = `/courses/${slug}`;
  return mergeSeo(path, {
    // Absolute (i.e. the layout's `%s · IMETS Medical School` template is
    // skipped) in two cases: the winning title already carries the school name,
    // so the template can't double it; or the course opted out of the suffix
    // because the composed title would otherwise truncate in the SERP.
    title:
      course.suppressBrandSuffix || (!adminTitle && bundledTitle)
        ? { absolute: title }
        : title,
    description,
    ...(keywords.length ? { keywords } : {}),
    // Per-course canonical override wins over the computed one (retired cohorts,
    // duplicate landing pages); otherwise the normal alternates apply.
    alternates: course.canonicalOverride
      ? { ...seoAlternates(path, locale), canonical: course.canonicalOverride }
      : seoAlternates(path, locale),
    // Per-course robots directive — lets a retired course be de-indexed without
    // unpublishing it.
    ...(course.robotsDirective && course.robotsDirective !== "index,follow"
      ? {
          robots: {
            index: false,
            follow: course.robotsDirective === "noindex,follow",
          },
        }
      : {}),
    // Social cards keep the course's own name — a SERP-tuned meta title reads
    // oddly as a shared link headline. A dedicated 1200×630 image wins over the
    // course thumbnail, which is the wrong aspect ratio for social previews.
    ...socialMeta({
      title: courseName,
      description,
      path,
      locale,
      image: course.ogImage || course.thumbnailUrl,
    }),
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Marketing");

  const coursesRes = await dal.courses.fetchCourses();
  const courses = coursesRes.ok ? coursesRes.data : [];
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();

  // The course's REAL instructor. Previously this picked an arbitrary person via
  // `instructors[titleEn.length % instructors.length]` — a random staff member
  // presented as this course's instructor. Use the course's own data instead.
  const instructorName =
    course.instructorProfile?.name ?? course.instructorNames?.[0] ?? undefined;
  const onSale =
    course.salePriceEGP > 0 && course.salePriceEGP < course.priceEGP;
  const price = onSale ? course.salePriceEGP : course.priceEGP;
  const previewVideoId = extractYouTubeVideoId(course.previewVideoUrl);
  // Real reviews typed into the course form (Media & Reviews) are the source of
  // truth for the wall, the rating and the review count. `mapCourse` already
  // averages them into `course.rating`, so a real rating implies real reviews.
  const realReviews = course.textReviews ?? [];
  const hasRealReviews = realReviews.length > 0;

  // No invented fallbacks. A course with no consented reviews shows no rating
  // and no review count anywhere — visible page and markup alike. The previous
  // "4.9" / `students * 0.15` defaults presented fabricated numbers as student
  // feedback; they are gone.
  const rating = hasRealReviews ? course.rating : 0;
  const reviews = hasRealReviews ? realReviews.length : 0;

  // Long-form conversion + SEO content (bespoke for CPHQ, generic otherwise).
  const content = getCourseContent({
    slug: course.slug,
    titleEn: course.titleEn,
    titleAr: course.titleAr,
    locale,
  });
  const distribution = ratingDistribution(rating);

  // Course-specific outcomes ("this is what I'll be able to DO"), never generic
  // business filler. Falls back to the course record, then renders nothing.
  const courseOutcomes =
    (locale === "ar" ? course.whatYouWillLearnAr : course.whatYouWillLearnEn) ??
    [];
  const outcomes =
    courseOutcomes.length > 0 ? courseOutcomes : content.outcomes;

  // "Continue Your Professional Journey": the slugs picked in the course form
  // win, in the order they were picked. Nothing picked ⇒ same-category, which is
  // what every course showed before this became editable.
  const curated = (course.relatedCourseSlugs?.length
    ? course.relatedCourseSlugs
    : content.relatedSlugs)
    .map((slug) => courses.find((c) => c.slug === slug && c.id !== course.id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const related = curated.length
    ? curated.slice(0, 4)
    : courses
        .filter((c) => c.id !== course.id && c.category === course.category)
        .slice(0, 4);

  const tr = (en: string, ar: string) => (locale === "ar" ? ar : en);

  /** Country landing pages that exist for this course (SEO-08). */
  const geoPages = geoCoursePagesFor(course.slug);

  /*
   * Link the course's instructor block to a real faculty profile when one
   * matches, so `CourseInstance.instructor` can reference that Person by id
   * instead of carrying a second, unlinked copy of them. No match ⇒ the name is
   * emitted inline and nothing claims a profile page that does not exist.
   */
  const facultyRes = await dal.lookups.fetchInstructors();
  const faculty = (facultyRes.ok ? facultyRes.data : []).find(
    (i) =>
      !!course.instructorProfile?.name &&
      i.label.trim().toLowerCase() === course.instructorProfile.name.trim().toLowerCase(),
  );
  const instructorProfileUrl = faculty
    ? localeUrl(`/instructors/${faculty.slug || faculty.id}`, locale)
    : undefined;

  /*
   * Supporting articles, by reverse lookup on the blog's `relatedCourseSlugs`.
   * Linking ran one way — 48 posts pointed at courses and no course pointed
   * back — so each topic cluster had a hub page that was not actually a hub.
   *
   * Same-locale only: an Arabic course page linking out to English articles is
   * a cross-locale link, so the block simply does not render until Arabic posts
   * exist. Posts with no `language` are treated as English, which is what the
   * backend stores today.
   */
  const articlesRes = await dal.blog.fetchPublicArticles({ limit: 200 });
  const knowledgeArticles = (articlesRes.ok ? articlesRes.data.data : [])
    .filter(
      (p) =>
        (p.language || "en") === locale &&
        (p.relatedCourseSlugs ?? []).includes(course.slug),
    )
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 6)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      readingMinutes: p.readingMinutes,
      publishedAt: p.publishedAt,
    }));

  // The wall shows stored, consented reviews only. With none, the section is
  // not rendered at all — it must never fall back to sample testimonials.
  const reviewWall = realReviews.map((r) => ({
    name: r.reviewerName,
    role: r.title,
    country: r.country ?? "",
    rating: r.rating,
    text: r.comment,
  }));

  // Pass rate: published only when the course record carries BOTH a rate and the
  // basis it was measured from (the admin form and the API both enforce that
  // pairing). It used to be a hardcoded "92%" shown on a slug allowlist.
  /**
   * Offers for the Course schema: the effective price per currency (sale price
   * when discounted), so the markup always agrees with what the page charges.
   * A discounted offer carries `priceValidUntil` — a promotional price with no
   * end date reads as the permanent price.
   */
  // Single source of truth in lib/seo (OFFER_PRICE_VALID_UNTIL); returns
  // undefined once the promotion date has passed, so a stale constant omits the
  // property instead of shipping an expired one that disqualifies the offer.
  const priceValidUntil = onSale ? offerPriceValidUntil() : undefined;
  const offerPrices = (
    [
      { list: course.priceEGP, sale: course.salePriceEGP, currency: "EGP" },
      { list: course.priceSAR ?? 0, sale: course.salePriceSAR ?? 0, currency: "SAR" },
      { list: course.priceUSD ?? 0, sale: course.salePriceUSD ?? 0, currency: "USD" },
    ] as const
  )
    .map(({ list, sale, currency }) => {
      const discounted = sale > 0 && sale < list;
      return {
        price: discounted ? sale : list,
        currency,
        ...(discounted && priceValidUntil ? { priceValidUntil } : {}),
      };
    })
    .filter((o) => o.price > 0);

  // Course cover alt text (course form → Indexing & Social).
  const imageAlt =
    (locale === "ar" ? course.imageAltAr : course.imageAltEn) ||
    course.imageAltEn ||
    (locale === "ar" ? course.titleAr : course.titleEn);

  // Languages the course is delivered in, for `availableLanguage`.
  const courseLanguages = (course.languages ?? []).filter((l) => l && l.trim().length > 0);

  const proof = course.proof;
  const passRateBasis = (locale === "ar" ? proof?.passRateBasisAr : proof?.passRateBasisEn)
    || proof?.passRateBasisEn || "";
  const passRate =
    proof && proof.passRate > 0 && passRateBasis
      ? {
          value: proof.passRate,
          verifiedOn: proof.passRateVerifiedAt
            ? new Date(proof.passRateVerifiedAt).toLocaleDateString(
                locale === "ar" ? "ar-EG" : "en-US",
                { month: "short", year: "numeric" },
              )
            : "",
        }
      : null;

  // Facts only, from the course record. Rows with no data are omitted rather
  // than filled with a hardcoded guess (duration/language used to be literals,
  // and "Registration Ends" was always today+14 — a deadline that never lands).
  const startsOn = course.nextStartDate
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(course.nextStartDate))
    : "";
  const meta = [
    { icon: BarChart3, label: t("level"), value: course.difficulty },
    ...(course.duration
      ? [{ icon: Clock, label: t("duration"), value: course.duration }]
      : []),
    ...(startsOn
      ? [{ icon: CalendarDays, label: tr("Starts", "يبدأ"), value: startsOn }]
      : []),
    ...(course.lectures > 0
      ? [{ icon: PlayCircle, label: t("lessons"), value: `${course.lectures}` }]
      : []),
    ...(course.languages?.length
      ? [
          {
            icon: Globe,
            label: t("language"),
            value: course.languages.join(" · "),
          },
        ]
      : []),
  ];

  // Long-form content for the new sections — prefer the active locale, fall back.
  const pick = (en?: string, ar?: string) =>
    (locale === "ar" ? ar || en : en || ar)?.trim() ?? "";
  const description = pick(course.descriptionEn, course.descriptionAr);
  const whoShouldAttend = pick(course.whoCanAttendEn, course.whoCanAttendAr);
  const aboutBlock = buildCourseAbout(description, content.about);
  const isHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);
  const richBlock = (title: string, contentHtml: string) =>
    contentHtml ? (
      <div>
        <p className="font-heading text-xl font-semibold">{title}</p>
        {isHtml(contentHtml) ? (
          <div
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="prose prose-sm mt-4 max-w-none text-muted-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <p
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
          >
            {contentHtml}
          </p>
        )}
      </div>
    ) : null;

  // Closing CTA precedence: what was typed on the course record wins, then the
  // bundled per-course line, then the shared default inside CourseFinalCta.
  const dbCtaHeading = pick(course.finalCta?.headingEn, course.finalCta?.headingAr);
  const ctaHeading = dbCtaHeading || content.finalCta?.heading;
  const ctaBody =
    (dbCtaHeading ? pick(course.finalCta?.bodyEn, course.finalCta?.bodyAr) : "") ||
    (dbCtaHeading ? undefined : content.finalCta?.body);

  // Headings precedence, per heading: what was typed on the course wins, then
  // the bundled keyword heading, then the component's generic default (undefined).
  const h = course.headings;
  const heads = {
    whyChoose: pick(h?.whyChooseEn, h?.whyChooseAr) || content.headings?.whyChoose,
    audience: pick(h?.audienceEn, h?.audienceAr) || content.headings?.audience,
    learn: pick(h?.learnEn, h?.learnAr) || content.headings?.learn,
    careers: pick(h?.careersEn, h?.careersAr) || content.headings?.careers,
    about: pick(h?.aboutEn, h?.aboutAr) || content.headings?.about,
    faq: pick(h?.faqEn, h?.faqAr) || undefined,
  };

  // Personas and career-opportunity cards come from the bundled content only —
  // they are not editable in the course form.
  const personas = content.audience;
  const opportunities = content.careerOpportunities;

  const aboutHeading = heads.about ?? (/diploma|دبلوم/i.test(
    `${course.titleEn} ${course.titleAr}`,
  )
    ? tr("Why This Diploma Matters", "لماذا تهمّك هذه الدبلومة")
    : tr("Why This Program Matters", "لماذا يهمّك هذا البرنامج"));

  const courseUrl = localeUrl(`/courses/${slug}`, locale);
  const courseTitle = locale === "ar" ? course.titleAr : course.titleEn;
  // Optional marketing hero copy — falls back to the course title when blank.
  const heroHeadline =
    pick(course.headlineEn, course.headlineAr) || courseTitle;
  const heroSubheadline = pick(course.subHeadlineEn, course.subHeadlineAr);

  const applyWebhook =
    course.slug === "cphq-preparation"
      ? "https://aut.jobova.net/webhook/cphq"
      : undefined;

  const includes = [
    tr("Live Sessions", "جلسات مباشرة"),
    tr("Recordings", "التسجيلات"),
    tr("Practice Exams", "اختبارات تدريبية"),
    tr("Study Materials", "مواد دراسية"),
    tr("WhatsApp Support", "دعم عبر واتساب"),
    tr("Certificate", "شهادة معتمدة"),
  ];

  // Grouped FAQs (hospital etc.) win; else admin flat list / defaults as one group.
  const defaultFaqItems = [
    ...(whoShouldAttend
      ? [{
          q: tr("Who can join?", "من يمكنه الالتحاق؟"),
          a: parseAudienceItems(whoShouldAttend).join(" · "),
        }]
      : []),
    ...(course.duration
      ? [{
          q: tr("How long is the program?", "ما مدة البرنامج؟"),
          a: tr(
            `${course.duration}, with live weekly sessions plus self-paced material you can revisit anytime.`,
            `${course.duration}، مع جلسات مباشرة أسبوعية ومواد بوتيرتك يمكنك مراجعتها في أي وقت.`,
          ),
        }]
      : []),
    {
      q: tr("Do I need prior experience?", "هل أحتاج خبرة سابقة؟"),
      a: tr(
        "No — the program starts from the fundamentals and builds up, with mentor support throughout.",
        "لا — يبدأ البرنامج من الأساسيات ويتدرّج، مع دعم المرشدين طوال الوقت.",
      ),
    },
    {
      q: tr(
        "Is the course online or in person?",
        "هل الدورة أونلاين أم حضوريًا؟",
      ),
      a: tr(
        "100% online — live sessions over Zoom plus self-paced lessons you can revisit anytime.",
        "أونلاين 100% — جلسات مباشرة عبر Zoom ودروس بوتيرتك يمكنك مراجعتها في أي وقت.",
      ),
    },
    {
      q: tr("Will I get a certificate?", "هل سأحصل على شهادة؟"),
      a: tr(
        "Yes — you earn a verifiable certificate of completion to add to your CV and LinkedIn.",
        "نعم — تحصل على شهادة إتمام موثّقة تضيفها لسيرتك الذاتية وLinkedIn.",
      ),
    },
    {
      q: tr(
        "Can I study from Saudi Arabia or any GCC country?",
        "هل يمكنني الدراسة من السعودية أو أي دولة خليجية؟",
      ),
      a: tr(
        "Absolutely. The program is 100% online and our students join from across the GCC and the wider Middle East — all you need is an internet connection.",
        "بالتأكيد. البرنامج أونلاين 100% وطلابنا ينضمّون من جميع أنحاء الخليج والشرق الأوسط — كل ما تحتاجه هو اتصال بالإنترنت.",
      ),
    },
    {
      q: tr(
        "Do I receive recordings of the sessions?",
        "هل أحصل على تسجيلات الجلسات؟",
      ),
      a: tr(
        "Yes — every live session is recorded and added to your account, so you can rewatch anytime and never miss a thing.",
        "نعم — تُسجَّل كل جلسة مباشرة وتُضاف إلى حسابك، لتتمكّن من إعادة المشاهدة في أي وقت دون أن يفوتك شيء.",
      ),
    },
    {
      q: tr("What if I miss a live class?", "ماذا لو فاتتني جلسة مباشرة؟"),
      a: tr(
        "No problem — you'll find the full recording in your account within hours, plus the session materials, so you stay on track.",
        "لا مشكلة — ستجد التسجيل الكامل في حسابك خلال ساعات، بالإضافة إلى مواد الجلسة، لتبقى على المسار.",
      ),
    },
    {
      q: tr(
        "Will I get lifetime access to the materials?",
        "هل سأحصل على وصول مدى الحياة للمواد؟",
      ),
      a: tr(
        "You keep access to the course materials and recordings so you can revise for your exam and refresh your knowledge whenever you need.",
        "تحتفظ بالوصول إلى مواد الدورة والتسجيلات لتراجع قبل امتحانك وتنعش معلوماتك متى احتجت.",
      ),
    },
    {
      q: tr("How do I enroll?", "كيف أسجّل؟"),
      a: tr(
        "Tap Apply Now, fill the short form, and an advisor will contact you to confirm your seat and answer any questions.",
        "اضغط قدّم الآن، واملأ النموذج القصير، وسيتواصل معك مستشار لتأكيد مقعدك والإجابة عن أسئلتك.",
      ),
    },
  ];
  // Precedence, most specific first: FAQs typed into the course form win, then
  // the bundled grouped copy, then the shared defaults.
  const faqGroups = course.faqs?.length
    ? [
        {
          title: tr("General", "عام"),
          items: course.faqs.map((f) => ({
            q: pick(f.questionEn, f.questionAr),
            a: pick(f.answerEn, f.answerAr),
          })),
        },
      ]
    : content.faqs?.length
      ? content.faqs
      : [{ title: tr("General", "عام"), items: defaultFaqItems }];
  // FAQPage schema follows what's actually on the page: when a sales FAQ is
  // shown inside the Knowledge Center, mark that up (the standalone FAQ is
  // hidden in that case); otherwise mark up the regular FAQ.
  const faqsFlat = content.salesFaq?.length
    ? content.salesFaq
    : faqGroups.flatMap((g) => g.items);

  // Career Outcomes ladder: the course form's roles win over the bundled ladder.
  // Array order IS the progression, so it is preserved as authored.
  const careerRoles = course.careerRoles?.length
    ? course.careerRoles
        .map((r) => ({
          title: pick(r.titleEn, r.titleAr),
          description: pick(r.descriptionEn, r.descriptionAr) || undefined,
        }))
        .filter((r) => r.title)
    : content.careerRoles;

  // Reason cards under the hero. The course form's cards win, then the bundled
  // per-course set, then the shared IMETS reasons. DB-first matches faqs and
  // careerRoles above; previously the bundled set always won, which silently
  // shadowed anything typed into the form.
  const whyCards = course.whyChoose?.length
    ? course.whyChoose.map((r) => ({
        title: pick(r.titleEn, r.titleAr),
        body: pick(r.bodyEn, r.bodyAr),
      }))
    : content.whyThisDiploma.length > 0
      ? content.whyThisDiploma
      : content.whyChoose;

  // Editorial pull-quote: the course form's quote wins, else the bundled
  // per-course demand line. DB-first, like the sections above.
  const pullQuote =
    pick(course.quote?.textEn, course.quote?.textAr) || content.demandLine;

  // "Download Brochure": a dedicated brochure/curriculum/program-guide URL if
  // set, else the uploaded course-overview PDF (the only one the admin form can
  // currently set). Empty ⇒ the button softly scrolls to the overview section.
  const brochureHref =
    course.brochureUrl ||
    course.curriculumUrl ||
    course.programGuideUrl ||
    course.courseOverviewUrl ||
    "";

  const navItems = [
    { id: "why-choose", label: tr("Highlights", "المميزات") },
    { id: "overview", label: tr("Why It Matters", "لماذا يهم") },
    { id: "audience", label: tr("Who Should Join", "لمن البرنامج") },
    { id: "careers", label: tr("Career Outcomes", "المخرجات المهنية") },
    { id: "learn", label: t("whatYouLearn") },
    ...(course.modules?.length
      ? [{ id: "curriculum", label: t("curriculum") }]
      : []),
    { id: "journey", label: tr("Experience", "التجربة") },
    { id: "reviews", label: tr("Reviews", "التقييمات") },
    { id: "faq", label: tr("Admissions", "القبول") },
    ...(content.knowledgeCenter?.length
      ? [{ id: "knowledge-center", label: tr("Knowledge Center", "مركز المعرفة") }]
      : []),
    ...(knowledgeArticles.length
      ? [{ id: "articles", label: tr("Articles", "مقالات") }]
      : []),
  ];

  const enrollCard = (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_12px_48px_rgba(15,23,42,0.14)] ring-1 ring-border/60">
      {previewVideoId ? (
        <YouTubePlayer videoId={previewVideoId} autoPlay={false} />
      ) : (
        <div className="relative aspect-video bg-muted">
          {/* LCP element on mobile (the enroll card renders inline near the top
              there, and in the sticky rail on lg+). `priority` opts out of the
              default lazy-load; `sizes` must describe BOTH layouts or the
              browser picks a 360px source for a full-width phone card. */}
          <Image
            src={course.thumbnailUrl}
            // Admin-authored alt text wins; the title is only a fallback (it
            // duplicates the H1, which is poor alt text but better than none).
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 360px, 100vw"
            className="object-cover"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/20">
            <PlayCircle className="size-14 text-white/90" />
          </span>
        </div>
      )}
      <div className="space-y-4 p-5">
        {/* Urgency — only from a REAL cohort date. Was `today + 14 days`, i.e. a
            deadline that reset every day and never actually arrived. */}
        {(startsOn || course.seatsLeft) && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/40">
            <Flame className="size-4 shrink-0" />
            <span>
              {/* Both facts come from the course record. `seatsLeft` was set on
                  the model and mapped into CourseRow but never rendered — the
                  earlier "18 seats left" was a literal, so this stays silent
                  unless a real number is set. */}
              {startsOn
                ? tr(
                    `Next cohort starts ${startsOn}`,
                    `الدفعة القادمة تبدأ ${startsOn}`,
                  )
                : ""}
              {startsOn && course.seatsLeft ? " · " : ""}
              {course.seatsLeft
                ? tr(
                    `${course.seatsLeft} seats left`,
                    `${course.seatsLeft} مقعد متبقٍ`,
                  )
                : ""}
            </span>
          </div>
        )}

        {/* Social proof — every claim here comes from the course record. The
            stars/rating line only appears with consented reviews behind it, the
            pass rate only when one is stored WITH its basis, and the student
            count only when it is set. Nothing is asserted by default. */}
        {(hasRealReviews || course.students > 0 || passRate) && (
          <div className="space-y-2.5 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            {hasRealReviews && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn("size-4", i < Math.round(rating) ? "fill-current" : "opacity-30")}
                    />
                  ))}
                </span>
                <span className="font-heading text-base font-bold text-foreground tabular-nums">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tr(
                    `Based on ${reviews.toLocaleString()} ${reviews === 1 ? "review" : "reviews"}`,
                    `بناءً على ${reviews.toLocaleString()} تقييم`,
                  )}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {course.students > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-[#0b3fa8] ring-1 ring-blue-100 dark:ring-blue-900/40">
                  👨‍⚕️ {course.students.toLocaleString()}{" "}
                  {tr("Healthcare Professionals", "متخصص رعاية صحية")}
                </span>
              )}
              {passRate && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:text-emerald-300 dark:ring-emerald-900/40"
                  title={passRateBasis || undefined}
                >
                  🎓 {tr(
                    `${passRate.value}% First-Attempt Pass Rate`,
                    `${passRate.value}٪ نجاح من أول محاولة`,
                  )}
                  {passRate.verifiedOn && (
                    <span className="font-normal opacity-80">
                      · {tr(`verified ${passRate.verifiedOn}`, `مُحقّق ${passRate.verifiedOn}`)}
                    </span>
                  )}
                </span>
              )}
            </div>
            {passRate && passRateBasis && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">{passRateBasis}</p>
            )}
          </div>
        )}

        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {tr("Program Investment", "الاستثمار في البرنامج")}
        </p>
        {/* Currency follows the visitor's country (EG→EGP, SA→SAR, else→USD),
            resolved client-side; EGP is the SSR default. */}
        <CoursePrice
          locale={locale}
          variant="hero"
          egp={{ price: course.priceEGP, sale: course.salePriceEGP }}
          sar={{ price: course.priceSAR ?? 0, sale: course.salePriceSAR ?? 0 }}
          usd={{ price: course.priceUSD ?? 0, sale: course.salePriceUSD ?? 0 }}
        />
        <CourseApplyDialog
          courseId={course.id}
          courseTitle={course.titleEn}
          webhookUrl={applyWebhook}
          trigger={
            <Button size="lg" className="w-full">
              {t("applyNow")}
            </Button>
          }
        />
        <Button
          asChild
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
        >
          <a
            href={brochureHref || "#overview"}
            {...(brochureHref
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {tr("Download Brochure", "تحميل البروشور")}
          </a>
        </Button>

        <ul className="space-y-2 pt-1 text-sm">
          {meta.map((m) => (
            <li key={m.label} className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <m.icon className="size-4" />
                {m.label}
              </span>
              <span className="font-medium">{m.value}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 pt-4">
          <p className="text-sm font-semibold">{tr("Included", "المتضمَّن")}</p>
          <ul className="mt-2.5 space-y-2 text-sm text-foreground/80">
            {includes.map((label) => (
              <li key={label} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <JsonLd
        data={[
          courseLd({
            name: courseTitle,
            description: metaDescription(description, courseTitle),
            url: courseUrl,
            image: course.thumbnailUrl,
            locale,
            price,
            currency: "EGP",
            // Everything below is stored on the course record; blank fields are
            // omitted from the markup rather than emitted empty.
            alternateName: locale === "ar" ? course.titleEn : course.titleAr,
            courseCode: course.courseCode,
            educationalLevel: course.educationalLevel || course.difficulty,
            timeRequired: isoWeeks(course.duration),
            credentialAwarded:
              (locale === "ar" ? course.credentialAwardedAr : course.credentialAwardedEn) ||
              course.credentialAwardedEn,
            prerequisites:
              (locale === "ar" ? course.prerequisitesAr : course.prerequisitesEn) ||
              course.prerequisitesEn,
            teaches:
              ((locale === "ar" ? course.teachesAr : course.teachesEn) ?? []).length
                ? (locale === "ar" ? course.teachesAr : course.teachesEn)
                : outcomes,
            audience: locale === "ar" ? course.whoCanAttendAr : course.whoCanAttendEn,
            availableLanguage: courseLanguages,
            // One offer per currency, quoting the price a buyer is ACTUALLY
            // charged — the sale price where one is set. Emitting the struck-
            // through list price while the page charges less is a structured-
            // data/visible-content mismatch, which is a spam-policy problem
            // rather than a cosmetic one.
            offers: offerPrices,
            // Future cohorts only — `courseLd` drops past-dated ones itself.
            instances: course.intakes,
            courseMode: "online",
            instructors: instructorName
              ? [{ name: instructorName, url: instructorProfileUrl }]
              : undefined,
            // Gated: real, consented reviews only. A course with none emits no
            // rating and no Review markup — silence beats claiming stars nobody gave.
            rating: hasRealReviews && course.rating > 0 ? course.rating : undefined,
            reviewCount: hasRealReviews ? realReviews.length : undefined,
            reviews: hasRealReviews
              ? realReviews.map((r) => ({
                  author: r.reviewerName,
                  rating: r.rating,
                  body: r.comment,
                  datePublished: r.datePublished || undefined,
                }))
              : undefined,
          }),
          breadcrumbLd([
            {
              name: locale === "ar" ? "الرئيسية" : "Home",
              url: localeUrl("/", locale),
            },
            {
              name: t("catalogBreadcrumb"),
              url: localeUrl("/courses", locale),
            },
            { name: courseTitle, url: courseUrl },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqsFlat.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          // Only for a course that actually has a preview video — most do not.
          ...(previewVideoId
            ? [
                courseVideoLd({
                  name: courseTitle,
                  description: metaDescription(description, courseTitle),
                  videoId: previewVideoId,
                  contentUrl: course.previewVideoUrl ?? "",
                }),
              ]
            : []),
        ]}
      />
      {/* Hero + floating enroll card */}
      <div className="overflow-x-hidden">
        <div className="mx-auto w-full max-w-[100rem] px-4 pb-20 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pb-0 lg:pt-6">
          <div className="mx-auto max-w-7xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
            >
              <Link href="/" className="hover:text-foreground">
                {tr("Home", "الرئيسية")}
              </Link>
              <ChevronRight className="size-3.5 rtl:rotate-180" />
              <Link href="/courses" className="hover:text-foreground">
                {t("catalogBreadcrumb")}
              </Link>
              <ChevronRight className="size-3.5 rtl:rotate-180" />
              <span className="line-clamp-1 text-foreground">
                {courseTitle}
              </span>
            </nav>
            <section className="marketing-gradient-bg overflow-hidden rounded-2xl px-6 py-8 shadow-2xl shadow-blue-950/30 ring-1 ring-inset ring-white/10 sm:rounded-[1.75rem] sm:px-8 sm:py-9 lg:rounded-[2rem] lg:px-10 lg:py-10">
              <div className="space-y-4 lg:max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300 sm:text-base">
                  {t("heroJourneyLead")}
                </p>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                  {courseTitle}
                </h1>
                {heroHeadline && heroHeadline !== courseTitle ? (
                  <p className="max-w-2xl text-lg font-medium leading-snug text-white/95 sm:text-xl">
                    {heroHeadline}
                  </p>
                ) : null}
                {heroSubheadline && (
                  <p className="max-w-2xl text-base leading-relaxed text-blue-50/90 sm:text-lg">
                    {heroSubheadline}
                  </p>
                )}
                <CourseHeroMeta course={course} locale={locale} />
              </div>
            </section>

            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-10 lg:-mt-1 xl:gap-x-12">
              <div className="min-w-0">
                <aside className="mt-6 lg:hidden">{enrollCard}</aside>

                <CourseSectionNav
                  items={navItems}
                  className="sticky top-16 z-20 -mx-4 mt-6 bg-background/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-2 lg:px-0"
                />

                {/* Flow: Interest → Trust → Content → Career → Experience → Proof → FAQ → Buy */}
                <div className="py-6 lg:pt-4">
                  <CourseSectionBand tone="white" spacing="lg">
                    <CourseWhyThisDiploma
                      locale={locale}
                      cards={whyCards}
                      title={heads.whyChoose}
                    />
                  </CourseSectionBand>

                </div>
              </div>

              <aside className="relative z-10 hidden lg:block">
                <div className="sticky top-24 -mt-32 xl:-mt-36">
                  {enrollCard}
                </div>
              </aside>
            </div>

            {/* Full-width from About onward — the enroll card's 380px column
                squeezed this copy (and its image, which goes 2-up on lg) into
                roughly half the page. Long-form prose needs the room. */}
            <div className="pb-24 lg:pb-8">
              <CourseSectionBand tone="muted" spacing="lg" className="lg:mt-2">
                {aboutBlock ? (
                  <CourseAbout
                    locale={locale}
                    about={aboutBlock}
                    heading={aboutHeading}
                    imageUrl={course.thumbnailUrl}
                    imageAlt={courseTitle}
                  />
                ) : description ? (
                  <section id="overview" className="scroll-mt-32">
                    {richBlock(t("courseDescription"), description)}
                  </section>
                ) : null}
              </CourseSectionBand>

              {personas?.length ? (
                <CourseSectionBand tone="muted" spacing="md">
                  <CourseAudienceCards
                    title={heads.audience ?? tr("Who This Program Is For", "لمن هذا البرنامج")}
                    personas={personas}
                    locale={locale}
                  />
                </CourseSectionBand>
              ) : whoShouldAttend ? (
                <CourseSectionBand tone="muted" spacing="md">
                  <CourseWhoShouldAttend
                    title={heads.audience ?? tr("Who This Program Is For", "لمن هذا البرنامج")}
                    content={whoShouldAttend}
                    locale={locale}
                  />
                </CourseSectionBand>
              ) : null}

              <CourseSectionBand tone="white" spacing="lg">
                <CourseCareerGrowth
                  locale={locale}
                  opportunities={opportunities}
                  roles={careerRoles}
                  title={heads.careers}
                  demandLine={undefined}
                />
              </CourseSectionBand>

              <CourseSectionBand tone="white" spacing="lg" className="lg:mt-2">
                <CourseWhatYouLearn
                  title={heads.learn ?? tr("What You'll Learn", "ماذا ستتعلّم")}
                  subtitle={t("whatYouLearnLead")}
                  items={outcomes}
                  locale={locale}
                />
              </CourseSectionBand>

              {course.modules?.length ? (
                <CourseSectionBand
                  tone="muted"
                  spacing="lg"
                  className="!bg-[#F8FAFF] dark:!bg-primary/[0.07] lg:!px-10 xl:!px-12"
                >
                  <section id="curriculum" className="scroll-mt-32 w-full">
                    <div className="max-w-3xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {tr("Live Curriculum", "منهج مباشر")}
                      </p>
                      <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                        {t("curriculum")}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                        {tr(
                          "Every module is taught live via Zoom — expand a step to see outcomes and sessions.",
                          "كل وحدة تُدرَّس مباشرة عبر زووم — افتح الخطوة لترى المخرجات والجلسات.",
                        )}
                      </p>
                    </div>
                    <div className="mt-8 w-full lg:mt-10">
                      <CourseCurriculum
                        modules={course.modules}
                        locale={locale}
                        moduleOutcomes={course.modules.map((m) =>
                          resolveModuleOutcomes(
                            course.slug,
                            m.titleEn || m.titleAr || "",
                            locale,
                          ),
                        )}
                        moduleTopics={course.modules.map((m) =>
                          resolveModuleTopics(
                            course.slug,
                            m.titleEn || m.titleAr || "",
                            locale,
                          ),
                        )}
                        moduleDetails={course.modules.map((m) =>
                          resolveModuleDetail(
                            course.slug,
                            m.titleEn || m.titleAr || "",
                          ),
                        )}
                      />
                    </div>
                  </section>
                </CourseSectionBand>
              ) : null}

              {pullQuote ? (
                <CourseSectionBand tone="emphasis" spacing="md">
                  <CoursePullQuote locale={locale} quote={pullQuote} />
                </CourseSectionBand>
              ) : null}

              <CourseSectionBand tone="emphasis" spacing="lg">
                <CourseLearningExperience locale={locale} />
              </CourseSectionBand>

              {(course.instructorProfile || instructorName) && (
                <CourseSectionBand tone="white" spacing="sm">
                  <CourseInstructor
                    locale={locale}
                    title={tr("Learn From Industry Experts", "تعلّم من خبراء المجال")}
                    profile={course.instructorProfile}
                    fallbackName={instructorName}
                  />
                </CourseSectionBand>
              )}

              {/* Reviews render only when real, consented ones exist. */}
              <CourseSectionBand tone="muted" spacing="lg">
                <CourseTrustBar locale={locale} />
                {hasRealReviews && (
                  <div className="mt-12">
                    <CourseReviews
                      locale={locale}
                      rating={rating}
                      reviewCount={reviews}
                      distribution={distribution}
                      reviews={reviewWall}
                    />
                  </div>
                )}
              </CourseSectionBand>

              {/* Standalone FAQ — hidden when a sales FAQ is incorporated into
                  the Knowledge Center (that section renders the FAQ itself). */}
              {!content.salesFaq?.length && (
                <CourseSectionBand tone="muted" spacing="md">
                  <CourseFaq locale={locale} groups={faqGroups} title={heads.faq} />
                </CourseSectionBand>
              )}

              {content.knowledgeCenter && content.knowledgeCenter.length > 0 && (
                <CourseSectionBand tone="white" spacing="lg">
                  <CourseKnowledgeCenter
                    locale={locale}
                    title={
                      content.knowledgeTitle ??
                      tr("Knowledge Center", "مركز المعرفة")
                    }
                    description={content.knowledgeIntro ?? undefined}
                    items={content.knowledgeCenter}
                    groups={content.knowledgeGroups ?? []}
                    faq={content.salesFaq ?? undefined}
                    ctaHeading={
                      content.knowledgeCta ??
                      tr("Ready to Start Your Journey?", "جاهز لبدء رحلتك؟")
                    }
                    cta={
                      <CourseApplyDialog
                        courseId={course.id}
                        courseTitle={course.titleEn}
                        webhookUrl={applyWebhook}
                        trigger={
                          <Button size="lg" className="w-full">
                            {t("applyNow")}
                          </Button>
                        }
                      />
                    }
                  />
                </CourseSectionBand>
              )}

              {content.seoSections.length > 0 && (
                <CourseSectionBand tone="white" spacing="lg">
                  <CourseSeoContent locale={locale} sections={content.seoSections} />
                </CourseSectionBand>
              )}

              {/* Country pages for this course. Also the crawl path to them —
                  an orphaned landing page in the sitemap and nowhere else is a
                  page Google is entitled to treat as low-value. */}
              {geoPages.length > 0 && (
                <CourseSectionBand tone="white" spacing="sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {tr("Studying from:", "تدرس من:")}
                    </span>
                    {geoPages.map((g) => {
                      const gc = geoContent(g, locale);
                      return (
                        <Link
                          key={g.country}
                          href={geoCoursePath(g)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <MapPin className="size-3.5" />
                          {tr(
                            `${gc.countryName} — fees in ${g.currency}`,
                            `${gc.countryName} — الأسعار بـ ${g.currency}`,
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </CourseSectionBand>
              )}

              {knowledgeArticles.length > 0 && (
                <CourseSectionBand tone="muted" spacing="lg">
                  <CourseKnowledgeArticles
                    locale={locale}
                    articles={knowledgeArticles}
                    courseTitle={locale === "ar" ? course.titleAr || course.titleEn : course.titleEn}
                  />
                </CourseSectionBand>
              )}

              <CourseSectionBand
                tone="white"
                spacing="xl"
                className="!bg-transparent !px-0"
              >
                <CourseFinalCta
                  locale={locale}
                  heading={ctaHeading}
                  body={ctaBody}
                >
                  <CourseApplyDialog
                    courseId={course.id}
                    courseTitle={course.titleEn}
                    webhookUrl={applyWebhook}
                    trigger={
                      <Button
                        size="lg"
                        className="h-12 min-w-[11rem] flex-1 rounded-full bg-white px-8 text-base font-semibold text-primary shadow-lg shadow-black/10 hover:bg-white/95"
                      >
                        {t("applyNow")}
                      </Button>
                    }
                  />
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 min-w-[11rem] flex-1 rounded-full border-white/50 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
                  >
                    <a
                      href={brochureHref || "#overview"}
                      {...(brochureHref
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {tr("Download Brochure", "تحميل البروشور")}
                    </a>
                  </Button>
                </CourseFinalCta>
              </CourseSectionBand>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl py-14">
            <p className="font-heading text-2xl font-bold tracking-tight">
              {tr("Continue Your Professional Journey", "واصل مسيرتك المهنية")}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mobile enroll bar — always reachable while scrolling */}
      {/* Mobile purchase bar. The CTA alone isn't enough — once the hero scrolls
          away the price vanishes with it, so the visitor has to scroll back to
          recall what they're deciding on. Keep price + action together. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] leading-tight text-muted-foreground">
              {courseTitle}
            </p>
            <CoursePrice
              locale={locale}
              variant="compact"
              egp={{ price: course.priceEGP, sale: course.salePriceEGP }}
              sar={{ price: course.priceSAR ?? 0, sale: course.salePriceSAR ?? 0 }}
              usd={{ price: course.priceUSD ?? 0, sale: course.salePriceUSD ?? 0 }}
            />
          </div>
          <CourseApplyDialog
            courseId={course.id}
            courseTitle={course.titleEn}
            webhookUrl={applyWebhook}
            trigger={
              <Button
                size="lg"
                className="h-12 shrink-0 px-7 text-base font-semibold"
              >
                {t("applyNow")}
              </Button>
            }
          />
        </div>
      </div>

      {course.slug === "cphq-preparation" && (
        <WhatsAppFab
          phone="201115782721"
          message={tr(
            "Hello, I'd like to ask about the CPHQ course",
            "مرحبًا، أريد الاستفسار عن كورس CPHQ",
          )}
          label={tr("Chat with us on WhatsApp", "تواصل معنا عبر واتساب")}
        />
      )}
    </>
  );
}
