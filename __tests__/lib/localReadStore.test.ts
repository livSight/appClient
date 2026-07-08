import * as SecureStore from "expo-secure-store";
import {
  getLocalReadAt,
  hydrateLocalReadStore,
  resetLocalReadStoreForTests,
  setLocalReadAt,
} from "@/lib/api/localReadStore";

describe("localReadStore", () => {
  beforeEach(() => {
    resetLocalReadStoreForTests();
    jest.clearAllMocks();
  });

  it("returns null when conversation was never opened", () => {
    expect(getLocalReadAt("1001")).toBeNull();
  });

  it("setLocalReadAt writes synchronously to cache", () => {
    setLocalReadAt("1001");
    expect(getLocalReadAt("1001")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "livsight_cr_1001",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
  });

  it("uses the newest message timestamp when it is ahead of the device clock", () => {
    const future = new Date(Date.now() + 120_000).toISOString();
    setLocalReadAt("1001", future);
    expect(getLocalReadAt("1001")).toBe(future);
  });

  it("ignores atLeast when the device clock is already ahead", () => {
    const past = new Date(Date.now() - 120_000).toISOString();
    setLocalReadAt("1001", past);
    const stamped = getLocalReadAt("1001");
    expect(stamped).not.toBe(past);
    expect(Date.parse(stamped!)).toBeGreaterThan(Date.parse(past));
  });

  it("never moves the stamp backwards", () => {
    const future = new Date(Date.now() + 120_000).toISOString();
    setLocalReadAt("1001", future);
    setLocalReadAt("1001");
    expect(getLocalReadAt("1001")).toBe(future);
  });

  it("hydrateLocalReadStore loads from SecureStore without overwriting in-session cache", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("2026-06-14T10:00:00.000Z");
    await hydrateLocalReadStore(["1001"]);
    expect(getLocalReadAt("1001")).toBe("2026-06-14T10:00:00.000Z");

    setLocalReadAt("1001");
    const afterOpen = getLocalReadAt("1001");

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce("2026-06-14T10:00:00.000Z");
    await hydrateLocalReadStore(["1001"]);
    expect(getLocalReadAt("1001")).toBe(afterOpen);
  });
});
