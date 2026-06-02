/**
 * Push token registration is off in __DEV__ by default (avoids Expo network errors in local dev).
 * Set EXPO_PUBLIC_ENABLE_PUSH=true in .env to test push on a physical device.
 */
export function shouldRegisterPushNotifications(options?: {
  dev?: boolean;
  enablePushEnv?: string | undefined;
}): boolean {
  const dev = options?.dev ?? __DEV__;
  if (!dev) return true;

  const flag = (options?.enablePushEnv ?? process.env.EXPO_PUBLIC_ENABLE_PUSH)?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}
