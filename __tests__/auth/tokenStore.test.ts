import * as SecureStore from "expo-secure-store";
import {
  TOKEN_STORE_KEYS,
  clearTokens,
  loadTokens,
  saveTokens,
  type PersistedAuthSession,
} from "@/lib/auth/tokenStore";
import type { AuthTokens } from "@/lib/auth/authApi";

const sampleAuthTokens: AuthTokens = {
  accessToken: "access-token-abc",
  refreshToken: "refresh-token-xyz",
  expiresIn: 1200,
  tokenType: "Bearer",
};

describe("TOKEN_STORE_KEYS", () => {
  it("uses livsight namespaced keys", () => {
    expect(TOKEN_STORE_KEYS.accessToken).toBe("livsight.accessToken");
    expect(TOKEN_STORE_KEYS.refreshToken).toBe("livsight.refreshToken");
    expect(TOKEN_STORE_KEYS.expiresAt).toBe("livsight.expiresAt");
  });
});

describe("tokenStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe("saveTokens", () => {
    it("writes access, refresh, and expiresAt to SecureStore", async () => {
      const issuedAt = 1_780_109_143_000;

      await saveTokens(sampleAuthTokens, issuedAt);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        TOKEN_STORE_KEYS.accessToken,
        sampleAuthTokens.accessToken,
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        TOKEN_STORE_KEYS.refreshToken,
        sampleAuthTokens.refreshToken,
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        TOKEN_STORE_KEYS.expiresAt,
        String(issuedAt + sampleAuthTokens.expiresIn * 1000),
      );
    });
  });

  describe("loadTokens", () => {
    it("returns null when storage is empty", async () => {
      const result = await loadTokens();
      expect(result).toBeNull();
    });

    it("returns null when any required key is missing", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === TOKEN_STORE_KEYS.accessToken) return "access-token-abc";
        return null;
      });

      const result = await loadTokens();
      expect(result).toBeNull();
    });

    it("returns persisted session when all keys are present", async () => {
      const session: PersistedAuthSession = {
        accessToken: "access-token-abc",
        refreshToken: "refresh-token-xyz",
        expiresAt: 1_780_110_343_000,
      };

      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === TOKEN_STORE_KEYS.accessToken) return session.accessToken;
        if (key === TOKEN_STORE_KEYS.refreshToken) return session.refreshToken;
        if (key === TOKEN_STORE_KEYS.expiresAt) return String(session.expiresAt);
        return null;
      });

      const result = await loadTokens();
      expect(result).toEqual(session);
    });
  });

  describe("clearTokens", () => {
    it("removes all namespaced keys from SecureStore", async () => {
      await clearTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORE_KEYS.accessToken);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORE_KEYS.refreshToken);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORE_KEYS.expiresAt);
    });
  });

  describe("round-trip", () => {
    it("save then load returns the same session", async () => {
      const store = new Map<string, string>();
      (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
        store.set(key, value);
      });
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => store.get(key) ?? null);

      const issuedAt = 1_780_109_143_000;
      await saveTokens(sampleAuthTokens, issuedAt);
      const loaded = await loadTokens();

      expect(loaded).toEqual({
        accessToken: sampleAuthTokens.accessToken,
        refreshToken: sampleAuthTokens.refreshToken,
        expiresAt: issuedAt + sampleAuthTokens.expiresIn * 1000,
      });
    });

    it("clear after save returns null on load", async () => {
      const store = new Map<string, string>();
      (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
        store.set(key, value);
      });
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => store.get(key) ?? null);
      (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        store.delete(key);
      });

      await saveTokens(sampleAuthTokens, Date.now());
      await clearTokens();

      expect(await loadTokens()).toBeNull();
    });
  });
});
