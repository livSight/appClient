function parseBooleanEnv(value: unknown, fallback: boolean): boolean {
  if (value == null) return fallback;
  const raw = String(value).trim().toLowerCase();
  if (!raw.length) return fallback;
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") return false;
  if (raw === "true" || raw === "1" || raw === "yes" || raw === "on") return true;
  return fallback;
}

/**
 * Build-time feature flags (EAS / Expo env).
 *
 * Policy:
 * - Defaults are developer-friendly (enabled).
 * - Production Store builds should explicitly disable unfinished features via `eas.json`.
 */
export const featureFlags = {
  messagingEnabled: parseBooleanEnv(process.env.EXPO_PUBLIC_MESSAGING_ENABLED, true),
} as const;

