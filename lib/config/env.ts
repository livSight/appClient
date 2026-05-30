export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env (local dev) or eas.json (EAS builds).`);
  }
  return value;
}

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Backend API base URL — set via EXPO_PUBLIC_API_BASE_URL in .env / eas.json */
export const API_BASE_URL = stripTrailingSlash(requireEnv("EXPO_PUBLIC_API_BASE_URL"));

/** Keycloak auth service base URL — set via EXPO_PUBLIC_AUTH_BASE_URL in .env / eas.json */
export const AUTH_BASE_URL = stripTrailingSlash(requireEnv("EXPO_PUBLIC_AUTH_BASE_URL"));
