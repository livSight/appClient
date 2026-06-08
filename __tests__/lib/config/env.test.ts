import { requireEnv, stripTrailingSlash } from "@/lib/config/env";

const GATEWAY = "http://localhost:4040";

describe("requireEnv", () => {
  const original = process.env.EXPO_PUBLIC_GATEWAY_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_GATEWAY_URL;
    } else {
      process.env.EXPO_PUBLIC_GATEWAY_URL = original;
    }
  });

  it("returns trimmed value when set", () => {
    process.env.EXPO_PUBLIC_GATEWAY_URL = `  ${GATEWAY}  `;
    expect(requireEnv("EXPO_PUBLIC_GATEWAY_URL")).toBe(GATEWAY);
  });

  it("throws when EXPO_PUBLIC_GATEWAY_URL is missing", () => {
    delete process.env.EXPO_PUBLIC_GATEWAY_URL;
    expect(() => requireEnv("EXPO_PUBLIC_GATEWAY_URL")).toThrow(
      "EXPO_PUBLIC_GATEWAY_URL is not set. Add it to .env (local dev) or eas.json (EAS builds).",
    );
  });

  it("throws when EXPO_PUBLIC_GATEWAY_URL is empty", () => {
    process.env.EXPO_PUBLIC_GATEWAY_URL = "   ";
    expect(() => requireEnv("EXPO_PUBLIC_GATEWAY_URL")).toThrow("EXPO_PUBLIC_GATEWAY_URL is not set");
  });
});

describe("stripTrailingSlash", () => {
  it("removes trailing slashes", () => {
    expect(stripTrailingSlash(`${GATEWAY}/`)).toBe(GATEWAY);
    expect(stripTrailingSlash(`${GATEWAY}///`)).toBe(GATEWAY);
  });

  it("leaves url without trailing slash unchanged", () => {
    expect(stripTrailingSlash(GATEWAY)).toBe(GATEWAY);
  });
});

describe("GATEWAY_BASE_URL", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    jest.resetModules();
  });

  function loadEnv() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@/lib/config/env") as typeof import("@/lib/config/env");
  }

  function setRequiredEnv(overrides: Record<string, string> = {}) {
    process.env.EXPO_PUBLIC_GATEWAY_URL = overrides.EXPO_PUBLIC_GATEWAY_URL ?? `${GATEWAY}/`;
  }

  it("strips trailing slash from EXPO_PUBLIC_GATEWAY_URL", () => {
    setRequiredEnv({ EXPO_PUBLIC_GATEWAY_URL: `${GATEWAY}/` });
    const { GATEWAY_BASE_URL, API_BASE_URL, AUTH_BASE_URL } = loadEnv();
    expect(GATEWAY_BASE_URL).toBe(GATEWAY);
    expect(API_BASE_URL).toBe(GATEWAY);
    expect(AUTH_BASE_URL).toBe(GATEWAY);
  });

  it("throws at module load when EXPO_PUBLIC_GATEWAY_URL is missing", () => {
    process.env.EXPO_PUBLIC_GATEWAY_URL = "";
    expect(() => loadEnv()).toThrow("EXPO_PUBLIC_GATEWAY_URL is not set");
  });
});

describe("lib/config/auth re-export", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    jest.resetModules();
  });

  it("exports AUTH_BASE_URL from env", () => {
    process.env.EXPO_PUBLIC_GATEWAY_URL = GATEWAY;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AUTH_BASE_URL } = require("@/lib/config/auth") as typeof import("@/lib/config/auth");
    expect(AUTH_BASE_URL).toBe(GATEWAY);
  });
});
