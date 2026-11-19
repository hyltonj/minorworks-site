import { NextResponse } from "next/server";
import { makeToken, ownerId, sameHash, secret, tokenOk } from "@/lib/owner";

// Owner mode for the shared footer (see the comment block in public/footer.js).
// A passphrase check hands out a short-lived signed token; the footer on any Minor Works
// address trades that token for the owner ID. Nothing here is a login: owner mode only
// marks a browser as "the owner testing" so its visits can be left out of reports.

export const dynamic = "force-dynamic";

const baseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

// The footer calls this from other domains. The token is the credential, so any origin may ask.
export async function GET(req: Request) {
  const headers = { ...baseHeaders, "Access-Control-Allow-Origin": "*" };
  if (!secret()) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503, headers });
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!t || t.length > 300 || !tokenOk(t)) {
    return NextResponse.json({ ok: false }, { status: 401, headers });
  }
  return NextResponse.json({ ok: true, ownerId: ownerId() }, { headers });
}

export async function POST(req: Request) {
  const headers = baseHeaders;
  if (!secret()) return NextResponse.json({ error: "not_configured" }, { status: 503, headers });
  let pass = "";
  try {
    pass = String(((await req.json()) as { passphrase?: string }).passphrase || "");
  } catch {
    /* empty body */
  }
  const real = process.env.STATS_PASSPHRASE || process.env.OWNER_SECRET || "";
  if (!pass || !sameHash(pass, real)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "denied" }, { status: 401, headers });
  }
  const { token, expiresAt } = makeToken();
  return NextResponse.json({ ownerId: ownerId(), token, expiresAt }, { headers });
}

