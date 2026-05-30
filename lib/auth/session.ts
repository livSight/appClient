import { login as defaultLogin, type AuthTokens, type LoginCredentials } from "@/lib/auth/authApi";
import { decodeJwtPayload } from "@/lib/auth/jwt";
import { emitSessionInvalidated, type SessionInvalidatedReason } from "@/lib/auth/sessionEvents";
import { tokenStore as defaultTokenStore, type PersistedAuthSession, type TokenStore } from "@/lib/auth/tokenStore";

export type SessionUser = {
  keycloakId: string;
  email?: string;
};

export type AuthSessionDeps = {
  login: (credentials: LoginCredentials) => Promise<AuthTokens>;
  tokenStore: TokenStore;
  now?: () => number;
};

export type AuthSession = {
  loginAndPersist(credentials: LoginCredentials): Promise<AuthTokens>;
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  getValidAccessToken(): Promise<string | null>;
  getAccessToken(): Promise<string | null>;
  logout(reason?: SessionInvalidatedReason): Promise<void>;
  getSessionUser(): Promise<SessionUser | null>;
};

function isSessionExpired(session: PersistedAuthSession, nowMs: number): boolean {
  return nowMs >= session.expiresAt;
}

function toPersistedSession(tokens: AuthTokens, issuedAt: number): PersistedAuthSession {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: issuedAt + tokens.expiresIn * 1000,
  };
}

export function createAuthSession(deps: AuthSessionDeps): AuthSession {
  const now = deps.now ?? (() => Date.now());
  let cachedSession: PersistedAuthSession | null = null;

  async function loadValidSession(): Promise<PersistedAuthSession | null> {
    const session = cachedSession ?? (await deps.tokenStore.loadTokens());
    if (!session) return null;

    if (isSessionExpired(session, now())) {
      cachedSession = null;
      await deps.tokenStore.clearTokens();
      emitSessionInvalidated("expired");
      return null;
    }

    cachedSession = session;
    return session;
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

  async function logout(reason: SessionInvalidatedReason = "logout"): Promise<void> {
    cachedSession = null;
    await deps.tokenStore.clearTokens();
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
    logout,
    getSessionUser,
  };
}

export const authSession = createAuthSession({
  login: defaultLogin,
  tokenStore: defaultTokenStore,
});
