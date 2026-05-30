import { requireEnv, stripTrailingSlash } from "@/lib/config/env";

describe("requireEnv", () => {
  const original = process.env.EXPO_PUBLIC_AUTH_BASE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_AUTH_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_AUTH_BASE_URL = original;
    }
  });

  it("returns trimmed value when set", () => {
    process.env.EXPO_PUBLIC_AUTH_BASE_URL = "  http://156.67.27.35:4000  ";
    expect(requireEnv("EXPO_PUBLIC_AUTH_BASE_URL")).toBe("http://156.67.27.35:4000");
  });

  it("throws when EXPO_PUBLIC_AUTH_BASE_URL is missing", () => {
    delete process.env.EXPO_PUBLIC_AUTH_BASE_URL;
    expect(() => requireEnv("EXPO_PUBLIC_AUTH_BASE_URL")).toThrow(
      "EXPO_PUBLIC_AUTH_BASE_URL is not set. Add it to .env (local dev) or eas.json (EAS builds).",
    );
  });

  it("throws when EXPO_PUBLIC_AUTH_BASE_URL is empty", () => {
    process.env.EXPO_PUBLIC_AUTH_BASE_URL = "   ";
    expect(() => requireEnv("EXPO_PUBLIC_AUTH_BASE_URL")).toThrow("EXPO_PUBLIC_AUTH_BASE_URL is not set");
  });
});

describe("stripTrailingSlash", () => {
  it("removes trailing slashes", () => {
    expect(stripTrailingSlash("http://156.67.27.35:4000/")).toBe("http://156.67.27.35:4000");
    expect(stripTrailingSlash("http://156.67.27.35:4000///")).toBe("http://156.67.27.35:4000");
  });

  it("leaves url without trailing slash unchanged", () => {
    expect(stripTrailingSlash("http://156.67.27.35:4000")).toBe("http://156.67.27.35:4000");
  });
});

describe("AUTH_BASE_URL", () => {
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
    process.env.EXPO_PUBLIC_API_BASE_URL = overrides.EXPO_PUBLIC_API_BASE_URL ?? "http://156.67.27.35:8085";
    process.env.EXPO_PUBLIC_AUTH_BASE_URL =
      overrides.EXPO_PUBLIC_AUTH_BASE_URL ?? "http://156.67.27.35:4000/";
  }

  it("strips trailing slash from EXPO_PUBLIC_AUTH_BASE_URL", () => {
    setRequiredEnv({ EXPO_PUBLIC_AUTH_BASE_URL: "http://156.67.27.35:4000/" });
    const { AUTH_BASE_URL } = loadEnv();
    expect(AUTH_BASE_URL).toBe("http://156.67.27.35:4000");
  });

  it("throws at module load when EXPO_PUBLIC_AUTH_BASE_URL is missing", () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://156.67.27.35:8085";
    process.env.EXPO_PUBLIC_AUTH_BASE_URL = "";
    expect(() => loadEnv()).toThrow("EXPO_PUBLIC_AUTH_BASE_URL is not set");
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
    process.env.EXPO_PUBLIC_API_BASE_URL = "http://156.67.27.35:8085";
    process.env.EXPO_PUBLIC_AUTH_BASE_URL = "http://156.67.27.35:4000";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AUTH_BASE_URL } = require("@/lib/config/auth") as typeof import("@/lib/config/auth");
    expect(AUTH_BASE_URL).toBe("http://156.67.27.35:4000");
  });
});
