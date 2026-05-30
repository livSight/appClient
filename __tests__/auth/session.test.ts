import type { AuthTokens, LoginCredentials } from "@/lib/auth/authApi";
import { createAuthSession, type SessionUser } from "@/lib/auth/session";
import type { PersistedAuthSession, TokenStore } from "@/lib/auth/tokenStore";

function base64UrlEncode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function buildAccessToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: "RS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.mock-signature`;
}

describe("auth session", () => {
  const credentials: LoginCredentials = {
    username: "snake123@example.com",
    password: "Abc123",
  };

  const authTokens: AuthTokens = {
    accessToken: buildAccessToken({
      sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
      exp: 1_780_110_343,
    }),
    refreshToken: "refresh-token-xyz",
    expiresIn: 1200,
    tokenType: "Bearer",
  };

  let mockLogin: jest.Mock;
  let mockStore: jest.Mocked<TokenStore>;
  let nowMs: number;
  let session: ReturnType<typeof createAuthSession>;

  beforeEach(() => {
    nowMs = 1_780_109_143_000;
    mockLogin = jest.fn();
    mockStore = {
      saveTokens: jest.fn(async () => undefined),
      loadTokens: jest.fn(async () => null),
      clearTokens: jest.fn(async () => undefined),
    };
    session = createAuthSession({
      login: mockLogin,
      tokenStore: mockStore,
      now: () => nowMs,
    });
  });

  describe("loginAndPersist", () => {
    it("calls auth login and persists tokens with issuedAt", async () => {
      mockLogin.mockResolvedValue(authTokens);

      const result = await session.loginAndPersist(credentials);

      expect(mockLogin).toHaveBeenCalledWith(credentials);
      expect(mockStore.saveTokens).toHaveBeenCalledWith(authTokens, nowMs);
      expect(result).toEqual(authTokens);
    });
  });

  describe("getValidAccessToken", () => {
    it("returns cached access token when session is not expired", async () => {
      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);

      const token = await session.getValidAccessToken();

      expect(token).toBe(authTokens.accessToken);
      expect(mockStore.loadTokens).not.toHaveBeenCalled();
    });

    it("loads from token store when cache is empty", async () => {
      const persisted: PersistedAuthSession = {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: nowMs + 600_000,
      };
      mockStore.loadTokens.mockResolvedValue(persisted);

      const token = await session.getValidAccessToken();

      expect(mockStore.loadTokens).toHaveBeenCalledTimes(1);
      expect(token).toBe(authTokens.accessToken);
    });

    it("returns null and clears store when session is expired", async () => {
      const persisted: PersistedAuthSession = {
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
        expiresAt: nowMs - 1,
      };
      mockStore.loadTokens.mockResolvedValue(persisted);

      const token = await session.getValidAccessToken();

      expect(token).toBeNull();
      expect(mockStore.clearTokens).toHaveBeenCalledTimes(1);
    });

    it("returns null when no session exists", async () => {
      const token = await session.getValidAccessToken();
      expect(token).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears token store and in-memory cache", async () => {
      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);

      await session.logout();

      expect(mockStore.clearTokens).toHaveBeenCalledTimes(1);
      expect(await session.getValidAccessToken()).toBeNull();
    });

    it("emits unauthorized reason when provided", async () => {
      const listener = jest.fn();
      const { onSessionInvalidated } = require("@/lib/auth/sessionEvents");
      const unsubscribe = onSessionInvalidated(listener);

      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);
      await session.logout("unauthorized");

      expect(listener).toHaveBeenCalledWith("unauthorized");
      unsubscribe();
    });
  });

  describe("getSessionUser", () => {
    it("returns keycloakId and email decoded from access token", async () => {
      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);

      const user = await session.getSessionUser();

      expect(user).toEqual({
        keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
        email: "snake123@example.com",
      } satisfies SessionUser);
    });

    it("returns null when there is no valid session", async () => {
      const user = await session.getSessionUser();
      expect(user).toBeNull();
    });
  });

  describe("authSession aliases", () => {
    it("exposes login, logout, and getAccessToken helpers", async () => {
      mockLogin.mockResolvedValue(authTokens);

      await session.login(credentials);
      expect(await session.getAccessToken()).toBe(authTokens.accessToken);

      await session.logout();
      expect(await session.getAccessToken()).toBeNull();
    });
  });
});
