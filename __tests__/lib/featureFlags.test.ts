describe("feature flags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_MESSAGING_ENABLED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("enables messaging by default when env var is missing", () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { featureFlags } = require("@/lib/featureFlags");
      expect(featureFlags.messagingEnabled).toBe(true);
    });
  });

  it("disables messaging when EXPO_PUBLIC_MESSAGING_ENABLED is false", () => {
    process.env.EXPO_PUBLIC_MESSAGING_ENABLED = "false";
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { featureFlags } = require("@/lib/featureFlags");
      expect(featureFlags.messagingEnabled).toBe(false);
    });
  });

  it("accepts common truthy values", () => {
    process.env.EXPO_PUBLIC_MESSAGING_ENABLED = "1";
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { featureFlags } = require("@/lib/featureFlags");
      expect(featureFlags.messagingEnabled).toBe(true);
    });
  });
});

