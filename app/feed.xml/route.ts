// RSS 2.0 feed — replaces the Jekyll Liquid template at /feed.xml.
import { buildFeedXml } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildFeedXml(), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
