export function requireEnv(name: string): string {
  // IMPORTANT: Expo/EAS only inlines EXPO_PUBLIC_* env vars when accessed statically.
  // Dynamic access like process.env[name] will be undefined in production builds.
  const raw =
    name === "EXPO_PUBLIC_GATEWAY_URL"
      ? process.env.EXPO_PUBLIC_GATEWAY_URL
      : process.env[name];
  const value = raw?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env (local dev) or eas.json (EAS builds).`);
  }
  return value;
}

export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** API gateway — all REST + auth traffic (set via EXPO_PUBLIC_GATEWAY_URL in .env / eas.json) */
export const GATEWAY_BASE_URL = stripTrailingSlash(requireEnv("EXPO_PUBLIC_GATEWAY_URL"));

export const API_BASE_URL = GATEWAY_BASE_URL;
export const AUTH_BASE_URL = GATEWAY_BASE_URL;
