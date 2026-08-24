// llmstxt.org site summary — replaces the Jekyll Liquid template at /llms.txt.
import { buildLlmsTxt } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
