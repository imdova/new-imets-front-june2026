import { SITE_URL } from "@/lib/seo";
import { xmlResponse } from "@/lib/sitemap-data";

/**
 * Sitemap index. `robots.txt` points here, and this is the URL already
 * submitted to Search Console — it must keep working.
 *
 * Keep this list in step with the sibling `sitemap-*.xml` route handlers.
 */
const CHILDREN = ["sitemap-pages", "sitemap-courses", "sitemap-blog", "sitemap-ar"] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const lastmod = new Date().toISOString();
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    CHILDREN.map(
      (name) =>
        `  <sitemap>\n` +
        `    <loc>${SITE_URL}/${name}.xml</loc>\n` +
        `    <lastmod>${lastmod}</lastmod>\n` +
        `  </sitemap>\n`,
    ).join("") +
    `</sitemapindex>\n`;

  return xmlResponse(body);
}
