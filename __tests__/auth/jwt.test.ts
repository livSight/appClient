import {
  decodeJwtPayload,
  getTokenExpiryMs,
  isTokenExpired,
  type JwtPayload,
} from "@/lib/auth/jwt";

function base64UrlEncode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function buildToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: "RS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.mock-signature`;
}

describe("decodeJwtPayload", () => {
  const samplePayload = {
    sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
    email: "snake123@example.com",
    exp: 1780110343,
    iat: 1780109143,
    preferred_username: "+237612345678",
  };

  it("returns sub, email, exp, and other claims from a JWT", () => {
    const token = buildToken(samplePayload);
    const decoded = decodeJwtPayload(token);

    expect(decoded.sub).toBe(samplePayload.sub);
    expect(decoded.email).toBe(samplePayload.email);
    expect(decoded.exp).toBe(samplePayload.exp);
    expect(decoded.iat).toBe(samplePayload.iat);
    expect(decoded.preferred_username).toBe(samplePayload.preferred_username);
  });

  it("throws when token is not a JWT", () => {
    expect(() => decodeJwtPayload("not-a-jwt")).toThrow("Invalid JWT");
  });

  it("throws when payload segment is not valid base64url JSON", () => {
    expect(() => decodeJwtPayload("aaa.bbb-not-json.ccc")).toThrow("Invalid JWT payload");
  });
});

describe("isTokenExpired", () => {
  const payload: JwtPayload = {
    sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
    exp: 1_780_110_343,
  };

  it("returns true when exp is in the past", () => {
    const nowMs = 1_780_110_344 * 1000;
    expect(isTokenExpired(payload, nowMs)).toBe(true);
  });

  it("returns false when exp is in the future", () => {
    const nowMs = 1_780_110_342 * 1000;
    expect(isTokenExpired(payload, nowMs)).toBe(false);
  });

  it("returns true when exp is exactly now", () => {
    const nowMs = 1_780_110_343 * 1000;
    expect(isTokenExpired(payload, nowMs)).toBe(true);
  });

  it("returns true when exp is missing", () => {
    expect(isTokenExpired({ sub: "user" }, Date.now())).toBe(true);
  });
});

describe("getTokenExpiryMs", () => {
  it("computes expiry from issuedAt and expiresIn seconds", () => {
    const issuedAt = 1_780_109_143_000;
    const expiresIn = 1200;
    expect(getTokenExpiryMs(expiresIn, issuedAt)).toBe(issuedAt + expiresIn * 1000);
  });

  it("throws when expiresIn is not a positive finite number", () => {
    expect(() => getTokenExpiryMs(0, Date.now())).toThrow("Invalid expiresIn");
    expect(() => getTokenExpiryMs(-1, Date.now())).toThrow("Invalid expiresIn");
  });
});

describe("decodeJwtPayload with live-shaped token", () => {
  it("decodes payload from a token-shaped string like the login API", () => {
    const token = buildToken({
      sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
      exp: 1780110343,
      iat: 1780109143,
      name: "Maxime Ndaa",
    });

    const decoded = decodeJwtPayload(token);
    expect(decoded.sub).toBe("5785160a-6c5c-44d5-96fd-d28aa677d8d4");
    expect(decoded.email).toBe("snake123@example.com");
  });

  it("decodes without Node Buffer (React Native / Expo Go path)", () => {
    const token = buildToken({
      sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
    });

    const originalBuffer = (globalThis as { Buffer?: typeof Buffer }).Buffer;
    (globalThis as { Buffer?: typeof Buffer }).Buffer = undefined;

    try {
      expect(decodeJwtPayload(token).email).toBe("snake123@example.com");
    } finally {
      (globalThis as { Buffer?: typeof Buffer }).Buffer = originalBuffer;
    }
  });
});
