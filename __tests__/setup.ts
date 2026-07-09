jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

/** Defaults so `lib/config/env.ts` can load during tests (overridden per test when needed). */
process.env.EXPO_PUBLIC_GATEWAY_URL =
  process.env.EXPO_PUBLIC_GATEWAY_URL ?? "http://localhost:4040";

if (typeof global.window !== "undefined" && typeof global.window.dispatchEvent !== "function") {
  global.window.dispatchEvent = jest.fn();
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});
