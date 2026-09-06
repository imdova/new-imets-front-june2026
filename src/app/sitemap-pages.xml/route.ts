import { collectSitemapRows, urlsetXml, xmlResponse } from "@/lib/sitemap-data";

/** English marketing, taxonomy and index pages. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { pages } = await collectSitemapRows();
  return xmlResponse(urlsetXml(pages, "en"));
}
