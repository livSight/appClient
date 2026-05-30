function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env (local dev) or eas.json (EAS builds).`);
  }
  return value;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Backend base URL — set via EXPO_PUBLIC_API_BASE_URL in .env / eas.json */
export const API_BASE_URL = stripTrailingSlash(requireEnv("EXPO_PUBLIC_API_BASE_URL"));

/** Dev user id for API calls until auth is wired — set via EXPO_PUBLIC_DEV_USER_ID */
export const DEV_USER_ID = (() => {
  const raw = requireEnv("EXPO_PUBLIC_DEV_USER_ID");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`EXPO_PUBLIC_DEV_USER_ID must be a positive number, got "${raw}"`);
  }
  return n;
})();
