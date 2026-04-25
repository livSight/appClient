import Constants from "expo-constants";

/**
 * EAS project ID for `getExpoPushTokenAsync`.
 * Set `expo.extra.eas.projectId` in app.json after `eas init`, or builds may not receive a push token.
 */
export function getEASProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromExtra = extra?.eas?.projectId;
  const fromEasConfig = (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  const id = fromExtra ?? fromEasConfig;
  if (typeof id === "string" && id.length > 0 && id !== "YOUR_PROJECT_ID") {
    return id;
  }
  return undefined;
}
