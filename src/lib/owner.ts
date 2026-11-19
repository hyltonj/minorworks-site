import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Signed, short-lived activation tokens and the stable owner ID for owner mode.
// The owner ID is derived from a server secret, so it never has to be stored.

export const TOKEN_MINUTES = 10;

export function secret(): string {
  return process.env.OWNER_SECRET || process.env.STATS_PASSPHRASE || "";
}
function key(): Buffer {
  return createHash("sha256").update("mw-owner-v1:" + secret()).digest();
}
const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

export function ownerId(): string {
  return "mw_owner_" + createHmac("sha256", key()).update("owner-id").digest("hex").slice(0, 16);
}

export function sameHash(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function makeToken(now = Date.now()): { token: string; expiresAt: number } {
  const expiresAt = now + TOKEN_MINUTES * 60_000;
  const payload = `${expiresAt.toString(36)}.${randomBytes(6).toString("hex")}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function tokenOk(token: string, now = Date.now()): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const exp = parseInt(parts[0], 36);
  if (!Number.isFinite(exp) || exp < now) return false;
  const want = sign(payload);
  return want.length === parts[2].length && timingSafeEqual(Buffer.from(want), Buffer.from(parts[2]));
}
