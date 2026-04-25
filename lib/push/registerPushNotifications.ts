import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getEASProjectId } from "@/lib/config/expoProject";
import { logger } from "@/lib/logger";

const ANDROID_CHANNEL_ID = "default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3090C0",
  });
}

/**
 * Requests permission, obtains Expo push token, and registers it with the vendor API.
 * No-ops on simulator / denied permission / missing EAS project id (with console warning).
 */
export async function registerPushNotificationsAsync(): Promise<void> {
  logger.debug("push", "device info", { isDevice: Device.isDevice, brand: Device.brand, modelName: Device.modelName });
  if (!Device.isDevice) {
    logger.info("push", "Not a physical device, skipping.");
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    logger.warn("push", "Permission not granted", finalStatus);
    return;
  }

  await ensureAndroidChannel();

  const projectId = getEASProjectId();
  if (!projectId) {
    logger.warn("push", "Missing EAS projectId; push token disabled.");
    return;
  }

  logger.info("push", "Getting Expo push token", { projectId });
  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  logger.debug("push", "Got token", expoPushToken);
  // UI-only mode: do not register token with any backend.
  logger.info("push", "UI-only mode: skipping backend token registration.");
}
