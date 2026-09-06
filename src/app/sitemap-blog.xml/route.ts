import { collectSitemapRows, urlsetXml, xmlResponse } from "@/lib/sitemap-data";

/** English published blog articles. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { blog } = await collectSitemapRows();
  return xmlResponse(urlsetXml(blog, "en"));
}
