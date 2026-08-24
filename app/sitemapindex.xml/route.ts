// Sitemap index — points at /sitemap.xml, the hand-maintained
// /sitemap-media.xml, and each book's own sitemap.
import { buildSitemapIndexXml } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildSitemapIndexXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
