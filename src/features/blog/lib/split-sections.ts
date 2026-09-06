import type { ArticleSection } from "@/types/blog";

/**
 * Split an article's blocks so something can be rendered in the middle of it.
 *
 * Splitting on the section boundary is the obvious approach and it does not
 * work: the block builder puts a whole article into one or two sections, so
 * most posts have all eleven of their H2s inside `sections[0]`. Cutting after
 * the first section put the callout below the last heading — the bottom of the
 * article, which is what it exists to avoid.
 *
 * So the cut is made at the second H2 *block*: after the reader has finished
 * the first major section and before the second one opens.
 *
 * Only single-column sections are eligible. Splitting a 2–4 column layout down
 * the middle would leave one column stranded above the callout and the rest
 * below, which reads as a rendering bug.
 */
export function splitAtSecondHeading(
  sections: ArticleSection[],
): { before: ArticleSection[]; after: ArticleSection[] } | null {
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.cols.length !== 1) continue;

    const col = section.cols[0];
    const headings = col.blocks
      .map((b, idx) => (b.type === "heading" && b.level === 2 ? idx : -1))
      .filter((idx) => idx >= 0);
    if (headings.length < 2) continue;

    const cut = headings[1];
    // A cut that leaves nothing on either side is not a mid-article position.
    if (cut <= 0 || cut >= col.blocks.length) continue;

    return {
      before: [
        ...sections.slice(0, i),
        { ...section, cols: [{ ...col, blocks: col.blocks.slice(0, cut) }] },
      ],
      after: [
        { ...section, id: `${section.id}-cont`, cols: [{ ...col, id: `${col.id}-cont`, blocks: col.blocks.slice(cut) }] },
        ...sections.slice(i + 1),
      ],
    };
  }
  return null;
}
