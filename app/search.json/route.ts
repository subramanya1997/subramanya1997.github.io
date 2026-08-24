// Client-side search index — replaces the Jekyll Liquid template at /search.json.
import { buildSearchJson } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildSearchJson(), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
