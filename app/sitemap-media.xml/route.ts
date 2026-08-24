// Google image/video sitemap — generated from the posts' embedded media,
// replacing the hand-maintained Jekyll-era file at the same URL.
import { buildSitemapMediaXml } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildSitemapMediaXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
