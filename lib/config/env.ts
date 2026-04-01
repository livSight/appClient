const DEFAULT_API_HOST_IOS = "http://localhost:3000";

function requireApiHost(): string {
  const host = process.env.EXPO_PUBLIC_API_HOST?.trim();
  if (host && host.length > 0) return host.replace(/\/$/, "");
  return DEFAULT_API_HOST_IOS;
}

export function apiBaseUrl(): string {
  return `${requireApiHost()}/api/v1`;
}

