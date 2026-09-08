import Image from "next/image";
import { CalendarDays, Clock, History } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getInitials } from "@/lib/utils";

/** A named author resolved to a real profile page, or null when none is set. */
export interface ArticleAuthor {
  name: string;
  /** Post-nominals or role — "MD, CPHQ" or "Head of Quality Programmes". */
  credentials?: string;
  avatarUrl?: string;
  /** Locale-independent path to their profile, e.g. "/instructors/jane-doe". */
  profilePath?: string;
}

const fmt = (iso: string | undefined, locale: string) =>
  iso
    ? new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

/**
 * Byline for an article.
 *
 * Healthcare content sits close to YMYL, where a named and credentialed author
 * is a genuine quality signal — but only when the person is real. When a post
 * has no author record, this falls back to attributing the school, which is
 * accurate: the school did publish it. It never invents a name or a credential,
 * and there is deliberately no placeholder expert to fall back to.
 *
 * "Last updated" appears only when the article was meaningfully revised after
 * publication. Showing it on a post edited an hour after publishing tells the
 * reader nothing and trains them to ignore the line.
 */
export function ArticleByline({
  author,
  organisationName,
  publishedAt,
  updatedAt,
  readingMinutes,
  locale,
}: {
  author: ArticleAuthor | null;
  organisationName: string;
  publishedAt?: string;
  updatedAt?: string;
  readingMinutes?: number;
  locale: string;
}) {
  const ar = locale === "ar";
  const name = author?.name ?? organisationName;

  /* A revision counts as an update a day or more after publication. */
  const published = publishedAt ? new Date(publishedAt).getTime() : 0;
  const updated = updatedAt ? new Date(updatedAt).getTime() : 0;
  const meaningfullyUpdated =
    published > 0 && updated > published + 24 * 60 * 60 * 1000;

  const identity = (
    <span className="inline-flex items-center gap-2">
      {/*
        The avatar represents a person, so it is drawn only when there is one.
        Falling back to the organisation used to render an initials disc reading
        "IM" directly before the name — "IM" + "IMETS Medical School", which any
        text extraction reads as "IMIMETS Medical School", and which is how an
        SEO crawl reported this byline. aria-hidden would have hidden that from
        a screen reader while leaving it in the text; not drawing it is the
        actual fix, and the disc was adding nothing for an organisation anyway.
      */}
      {author?.avatarUrl ? (
        <Image
          src={author.avatarUrl}
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="size-7 rounded-full object-cover"
        />
      ) : author ? (
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary"
        >
          {getInitials(name)}
        </span>
      ) : null}
      <span className="font-medium text-foreground">{name}</span>
      {author?.credentials && (
        <span className="text-muted-foreground">{author.credentials}</span>
      )}
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {author?.profilePath ? (
        <Link href={author.profilePath} className="hover:text-primary">
          {identity}
        </Link>
      ) : (
        identity
      )}

      {publishedAt && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4" />
          {/* Machine-readable, so the rendered date and `datePublished` in the
              structured data can be checked against each other. */}
          <time dateTime={publishedAt}>{fmt(publishedAt, locale)}</time>
        </span>
      )}

      {meaningfullyUpdated && (
        <span className="inline-flex items-center gap-1.5">
          <History className="size-4" />
          {ar ? "آخر تحديث" : "Last updated"}{" "}
          <time dateTime={updatedAt}>{fmt(updatedAt, locale)}</time>
        </span>
      )}

      {!!readingMinutes && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4" />
          {readingMinutes} {ar ? "دقيقة قراءة" : "min read"}
        </span>
      )}
    </div>
  );
}
