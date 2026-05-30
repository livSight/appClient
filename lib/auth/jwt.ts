/** Decoded JWT claims — client-side UX only; never used for security decisions. */
export type JwtPayload = {
  sub?: string;
  email?: string;
  exp?: number;
  iat?: number;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  [claim: string]: unknown;
};

function decodeBase64ToUtf8(base64: string): string {
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(base64, "base64").toString("utf8");
  }

  throw new Error("No base64 decoder available");
}

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return decodeBase64ToUtf8(normalized + padding);
}

export function decodeJwtPayload(token: string): JwtPayload {
  const parts = String(token ?? "").trim().split(".");
  if (parts.length < 2 || !parts[1]?.length) {
    throw new Error("Invalid JWT");
  }

  try {
    const json = decodeBase64Url(parts[1]);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid JWT payload");
    }
    return parsed as JwtPayload;
  } catch {
    throw new Error("Invalid JWT payload");
  }
}

export function isTokenExpired(payload: JwtPayload, now: number | Date = Date.now()): boolean {
  const exp = payload.exp;
  if (typeof exp !== "number" || !Number.isFinite(exp)) return true;
  const nowMs = now instanceof Date ? now.getTime() : now;
  return nowMs >= exp * 1000;
}

export function getTokenExpiryMs(expiresIn: number, issuedAt: number): number {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error("Invalid expiresIn");
  }
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    throw new Error("Invalid issuedAt");
  }
  return issuedAt + Math.round(expiresIn) * 1000;
}
