describe("test infrastructure", () => {
  it("runs jest with expo preset", () => {
    expect(true).toBe(true);
  });

  it("resolves @/ path alias", () => {
    const { logger } = require("@/lib/logger");
    expect(logger.info).toBeDefined();
  });

  it("mocks expo-secure-store", async () => {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync("test-key", "value");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("test-key", "value");
  });
});
