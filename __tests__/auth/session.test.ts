import { AuthError, type AuthTokens, type LoginCredentials } from "@/lib/auth/authApi";
import { createAuthSession, REFRESH_SKEW_MS, type SessionUser } from "@/lib/auth/session";
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

  const rotatedTokens: AuthTokens = {
    accessToken: buildAccessToken({
      sub: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
      exp: 1_780_111_543,
    }),
    refreshToken: "refresh-token-rotated",
    expiresIn: 300,
    tokenType: "Bearer",
  };

  let mockLogin: jest.Mock;
  let mockRefresh: jest.Mock;
  let mockRevoke: jest.Mock;
  let mockStore: jest.Mocked<TokenStore>;
  let nowMs: number;
  let session: ReturnType<typeof createAuthSession>;

  function persistedSession(expiresAt: number): PersistedAuthSession {
    return {
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      expiresAt,
    };
  }

  beforeEach(() => {
    nowMs = 1_780_109_143_000;
    mockLogin = jest.fn();
    mockRefresh = jest.fn();
    mockRevoke = jest.fn(async () => undefined);
    mockStore = {
      saveTokens: jest.fn(async (_tokens: AuthTokens, _issuedAt?: number): Promise<void> => undefined),
      loadTokens: jest.fn(async () => null),
      clearTokens: jest.fn(async (): Promise<void> => undefined),
    };
    session = createAuthSession({
      login: mockLogin,
      refresh: mockRefresh,
      revoke: mockRevoke,
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
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("loads from token store when cache is empty", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs + 600_000));

      const token = await session.getValidAccessToken();

      expect(mockStore.loadTokens).toHaveBeenCalledTimes(1);
      expect(token).toBe(authTokens.accessToken);
    });

    it("returns null when no session exists", async () => {
      const token = await session.getValidAccessToken();
      expect(token).toBeNull();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("silently refreshes when the access token is expired", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs - 1));
      mockRefresh.mockResolvedValue(rotatedTokens);

      const token = await session.getValidAccessToken();

      expect(mockRefresh).toHaveBeenCalledWith(authTokens.refreshToken);
      expect(token).toBe(rotatedTokens.accessToken);
    });

    it("refreshes proactively within the skew window before expiry", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs + REFRESH_SKEW_MS - 1000));
      mockRefresh.mockResolvedValue(rotatedTokens);

      const token = await session.getValidAccessToken();

      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(token).toBe(rotatedTokens.accessToken);
    });

    it("persists the rotated refresh token returned by /auth/refresh", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs - 1));
      mockRefresh.mockResolvedValue(rotatedTokens);

      await session.getValidAccessToken();

      expect(mockStore.saveTokens).toHaveBeenCalledWith(rotatedTokens, nowMs);
    });

    it("shares a single refresh across concurrent callers", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs - 1));
      let resolveRefresh: (tokens: AuthTokens) => void = () => undefined;
      mockRefresh.mockImplementation(
        () => new Promise<AuthTokens>((resolve) => {
          resolveRefresh = resolve;
        }),
      );

      const first = session.getValidAccessToken();
      const second = session.getValidAccessToken();
      await new Promise((resolve) => setTimeout(resolve, 0));
      resolveRefresh(rotatedTokens);
      const tokens = await Promise.all([first, second]);

      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(tokens).toEqual([rotatedTokens.accessToken, rotatedTokens.accessToken]);
    });

    it("clears storage and invalidates the session when refresh is rejected (4xx)", async () => {
      const listener = jest.fn();
      const { onSessionInvalidated } = require("@/lib/auth/sessionEvents");
      const unsubscribe = onSessionInvalidated(listener);

      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs - 1));
      mockRefresh.mockRejectedValue(new AuthError("invalid_grant", 400));

      const token = await session.getValidAccessToken();

      expect(token).toBeNull();
      expect(mockStore.clearTokens).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith("expired");
      unsubscribe();
    });

    it("keeps stored tokens on transient refresh failure (network / 5xx)", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs - 1));
      mockRefresh.mockRejectedValue(new AuthError("Network request failed"));

      const token = await session.getValidAccessToken();

      expect(token).toBeNull();
      expect(mockStore.clearTokens).not.toHaveBeenCalled();
    });

    it("returns the current token on transient failure when it is still valid", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs + 30_000));
      mockRefresh.mockRejectedValue(new AuthError("Bad gateway", 502));

      const token = await session.getValidAccessToken();

      expect(token).toBe(authTokens.accessToken);
      expect(mockStore.clearTokens).not.toHaveBeenCalled();
    });
  });

  describe("forceRefreshAccessToken", () => {
    it("refreshes even when the token looks valid locally", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs + 600_000));
      mockRefresh.mockResolvedValue(rotatedTokens);

      const token = await session.forceRefreshAccessToken();

      expect(mockRefresh).toHaveBeenCalledWith(authTokens.refreshToken);
      expect(token).toBe(rotatedTokens.accessToken);
    });

    it("returns null without a session", async () => {
      expect(await session.forceRefreshAccessToken()).toBeNull();
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("returns null on transient failure and keeps tokens", async () => {
      mockStore.loadTokens.mockResolvedValue(persistedSession(nowMs + 600_000));
      mockRefresh.mockRejectedValue(new AuthError("Network request failed"));

      expect(await session.forceRefreshAccessToken()).toBeNull();
      expect(mockStore.clearTokens).not.toHaveBeenCalled();
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

    it("revokes the refresh token remotely on explicit logout", async () => {
      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);

      await session.logout();

      expect(mockRevoke).toHaveBeenCalledWith(authTokens.refreshToken);
    });

    it("does not revoke remotely for non-user-initiated invalidation", async () => {
      mockLogin.mockResolvedValue(authTokens);
      await session.loginAndPersist(credentials);

      await session.logout("unauthorized");

      expect(mockRevoke).not.toHaveBeenCalled();
    });

    it("still logs out locally when remote revocation fails", async () => {
      mockLogin.mockResolvedValue(authTokens);
      mockRevoke.mockRejectedValue(new AuthError("Network request failed"));
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
