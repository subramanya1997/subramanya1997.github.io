// Full-content dump for agents — replaces the Jekyll template at /llms-full.txt.
import { buildLlmsFullTxt } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await buildLlmsFullTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
