import { collectSitemapRows, urlsetXml, xmlResponse } from "@/lib/sitemap-data";

/** English course pages — the commercial set. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { courses } = await collectSitemapRows();
  return xmlResponse(urlsetXml(courses, "en"));
}
