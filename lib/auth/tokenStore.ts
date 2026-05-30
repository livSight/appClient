import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "@/lib/auth/authApi";
import { getTokenExpiryMs } from "@/lib/auth/jwt";

export const TOKEN_STORE_KEYS = {
  accessToken: "livsight.accessToken",
  refreshToken: "livsight.refreshToken",
  expiresAt: "livsight.expiresAt",
} as const;

export type PersistedAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type TokenStore = {
  saveTokens(tokens: AuthTokens, issuedAt?: number): Promise<void>;
  loadTokens(): Promise<PersistedAuthSession | null>;
  clearTokens(): Promise<void>;
};

async function saveTokensImpl(tokens: AuthTokens, issuedAt: number = Date.now()): Promise<void> {
  const expiresAt = getTokenExpiryMs(tokens.expiresIn, issuedAt);
  await SecureStore.setItemAsync(TOKEN_STORE_KEYS.accessToken, tokens.accessToken);
  await SecureStore.setItemAsync(TOKEN_STORE_KEYS.refreshToken, tokens.refreshToken);
  await SecureStore.setItemAsync(TOKEN_STORE_KEYS.expiresAt, String(expiresAt));
}

async function loadTokensImpl(): Promise<PersistedAuthSession | null> {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_STORE_KEYS.accessToken),
    SecureStore.getItemAsync(TOKEN_STORE_KEYS.refreshToken),
    SecureStore.getItemAsync(TOKEN_STORE_KEYS.expiresAt),
  ]);

  if (!accessToken?.trim() || !refreshToken?.trim() || !expiresAtRaw?.trim()) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
    expiresAt,
  };
}

async function clearTokensImpl(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_STORE_KEYS.accessToken),
    SecureStore.deleteItemAsync(TOKEN_STORE_KEYS.refreshToken),
    SecureStore.deleteItemAsync(TOKEN_STORE_KEYS.expiresAt),
  ]);
}

export const tokenStore: TokenStore = {
  saveTokens: saveTokensImpl,
  loadTokens: loadTokensImpl,
  clearTokens: clearTokensImpl,
};

export const saveTokens = tokenStore.saveTokens.bind(tokenStore);
export const loadTokens = tokenStore.loadTokens.bind(tokenStore);
export const clearTokens = tokenStore.clearTokens.bind(tokenStore);
