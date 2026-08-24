// Versioned JSON API (v1) — the /api/v1/ surface is additive-only; see
// /docs/api-deprecation-policy/ for the versioning and sunset guarantees.
import { buildApiBooks } from "@/lib/nonhtml";

export const dynamic = "force-static";

export async function GET() {
  return new Response(buildApiBooks(), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
