// Section-level search index for the handbook's in-page search (served at the
// URL the HonKit lunr index used).
import { buildHandbookSearchIndex } from "@/lib/handbook";

export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify(await buildHandbookSearchIndex()), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
