import {
  AuthError,
  login as defaultLogin,
  refreshTokens as defaultRefreshTokens,
  revokeRefreshToken as defaultRevokeRefreshToken,
  type AuthTokens,
  type LoginCredentials,
} from "@/lib/auth/authApi";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { emitSessionInvalidated, type SessionInvalidatedReason } from "@/lib/auth/sessionEvents";
import { tokenStore as defaultTokenStore, type PersistedAuthSession, type TokenStore } from "@/lib/auth/tokenStore";

export type { AuthTokens, LoginCredentials } from "@/lib/auth/authApi";

export type SessionUser = {
  keycloakId: string;
  email?: string;
};

export type AuthSessionDeps = {
  login: (credentials: LoginCredentials) => Promise<AuthTokens>;
  refresh: (refreshToken: string) => Promise<AuthTokens>;
  /** Best-effort remote session revocation on explicit logout. */
  revoke?: (refreshToken: string) => Promise<void>;
  tokenStore: TokenStore;
  now?: () => number;
};

export type AuthSession = {
  loginAndPersist(credentials: LoginCredentials): Promise<AuthTokens>;
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  getValidAccessToken(): Promise<string | null>;
  getAccessToken(): Promise<string | null>;
  /** Refresh regardless of local expiry (e.g. after a 401). Returns the new access token, or null. */
  forceRefreshAccessToken(): Promise<string | null>;
  logout(reason?: SessionInvalidatedReason): Promise<void>;
  getSessionUser(): Promise<SessionUser | null>;
};

/** Refresh proactively this long before the access token expires. */
export const REFRESH_SKEW_MS = 60_000;

function toPersistedSession(tokens: AuthTokens, issuedAt: number): PersistedAuthSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: issuedAt + tokens.expiresIn * 1000,
  };
}

/** 4xx from /auth/refresh means the refresh token is invalid/expired/revoked. */
function isDefinitiveRefreshFailure(e: unknown): boolean {
  return e instanceof AuthError && typeof e.status === "number" && e.status >= 400 && e.status < 500;
}

export function createAuthSession(deps: AuthSessionDeps): AuthSession {
  const now = deps.now ?? (() => Date.now());
  let cachedSession: PersistedAuthSession | null = null;
  let refreshInFlight: Promise<PersistedAuthSession | null> | null = null;

  async function loadSession(): Promise<PersistedAuthSession | null> {
    if (cachedSession) return cachedSession;
    cachedSession = await deps.tokenStore.loadTokens();
    return cachedSession;
  }

  function needsRefresh(session: PersistedAuthSession): boolean {
    return now() >= session.expiresAt - REFRESH_SKEW_MS;
  }

  /**
   * Single-flight refresh: concurrent callers share one request. The rotated
   * refresh token from the response is always persisted. Only a definitive
   * rejection (4xx) invalidates the session; transient failures (network, 5xx —
   * e.g. a gateway redeploy) keep the stored tokens so the user stays logged in.
   */
  function refreshSession(current: PersistedAuthSession): Promise<PersistedAuthSession | null> {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          const tokens = await deps.refresh(current.refreshToken);
          const issuedAt = now();
          await deps.tokenStore.saveTokens(tokens, issuedAt);
          cachedSession = toPersistedSession(tokens, issuedAt);
          return cachedSession;
        } catch (e: unknown) {
          if (isDefinitiveRefreshFailure(e)) {
            cachedSession = null;
            await deps.tokenStore.clearTokens();
            emitSessionInvalidated("expired");
            return null;
          }
          return now() < current.expiresAt ? current : null;
        } finally {
          refreshInFlight = null;
        }
      })();
    }
    return refreshInFlight;
  }

  async function loadValidSession(): Promise<PersistedAuthSession | null> {
    const session = await loadSession();
    if (!session) return null;
    if (!needsRefresh(session)) return session;
    return refreshSession(session);
  }

  async function loginAndPersist(credentials: LoginCredentials): Promise<AuthTokens> {
    const tokens = await deps.login(credentials);
    const issuedAt = now();
    await deps.tokenStore.saveTokens(tokens, issuedAt);
    cachedSession = toPersistedSession(tokens, issuedAt);
    return tokens;
  }

  async function getValidAccessToken(): Promise<string | null> {
    const session = await loadValidSession();
    return session?.accessToken ?? null;
  }

  async function forceRefreshAccessToken(): Promise<string | null> {
    const session = await loadSession();
    if (!session) return null;
    const refreshed = await refreshSession(session);
    if (!refreshed || refreshed.accessToken === session.accessToken) return null;
    return refreshed.accessToken;
  }

  async function logout(reason: SessionInvalidatedReason = "logout"): Promise<void> {
    const session = cachedSession ?? (await deps.tokenStore.loadTokens().catch(() => null));
    cachedSession = null;
    await deps.tokenStore.clearTokens();
    if (reason === "logout" && session?.refreshToken && deps.revoke) {
      // Fire-and-forget: revocation must never block or fail the local logout.
      deps.revoke(session.refreshToken).catch(() => undefined);
    }
    emitSessionInvalidated(reason);
  }

  async function getSessionUser(): Promise<SessionUser | null> {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return null;

    const payload = decodeJwtPayload(accessToken);
    const keycloakId = typeof payload.sub === "string" ? payload.sub.trim() : "";
    if (!keycloakId.length) return null;

    const email = typeof payload.email === "string" ? payload.email.trim() : undefined;
    return {
      keycloakId,
      email: email?.length ? email : undefined,
    };
  }

  return {
    loginAndPersist,
    login: loginAndPersist,
    getValidAccessToken,
    getAccessToken: getValidAccessToken,
    forceRefreshAccessToken,
    logout,
    getSessionUser,
  };
}

export const authSession = createAuthSession({
  login: defaultLogin,
  refresh: defaultRefreshTokens,
  revoke: defaultRevokeRefreshToken,
  tokenStore: defaultTokenStore,
});
