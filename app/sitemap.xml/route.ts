// Sitemaps 0.9 document — replaces the Jekyll Liquid template at /sitemap.xml.
import { buildSitemapXml } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
