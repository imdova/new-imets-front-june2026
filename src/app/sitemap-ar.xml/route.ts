import { collectSitemapRows, urlsetXml, xmlResponse } from "@/lib/sitemap-data";

/**
 * Every Arabic counterpart, in one file, so Search Console reports Arabic
 * indexation as a single readable number.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const { pages, courses, blog } = await collectSitemapRows();
  return xmlResponse(urlsetXml([...pages, ...courses, ...blog], "ar"));
}
