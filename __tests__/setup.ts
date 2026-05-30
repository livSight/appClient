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
process.env.EXPO_PUBLIC_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://156.67.27.35:8085";
process.env.EXPO_PUBLIC_AUTH_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_BASE_URL ?? "http://156.67.27.35:4000";

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});
