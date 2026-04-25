import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { registerPushNotificationsAsync } from "@/lib/push/registerPushNotifications";
import { logger } from "@/lib/logger";
import {
  getDataFromNotification,
  parseDeliveryIdFromNotificationData,
} from "@/lib/push/notificationRouting";

function navigateFromNotificationResponse(
  router: ReturnType<typeof useRouter>,
  response: Notifications.NotificationResponse,
) {
  const data = getDataFromNotification(response.notification);
  const id = parseDeliveryIdFromNotificationData(data);
  if (id) {
    router.push(`/livraison-detail/${id}`);
  }
}

/**
 * Registers push token when logged in; handles notification tap + cold start from notification.
 */
export function usePushNotifications(pathname: string, checking: boolean) {
  const router = useRouter();
  const coldStartHandledRef = useRef(false);

  useEffect(() => {
    if (checking) return;

    let cancelled = false;
    (async () => {
      if (cancelled) return;
      try {
        await registerPushNotificationsAsync();
      } catch (e) {
        logger.error("push", "registerPushNotificationsAsync failed", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checking, pathname]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateFromNotificationResponse(router, response);
    });

    void (async () => {
      if (coldStartHandledRef.current) return;
      const last = await Notifications.getLastNotificationResponseAsync();
      coldStartHandledRef.current = true;
      if (last) {
        navigateFromNotificationResponse(router, last);
      }
    })();

    return () => sub.remove();
  }, [router]);
}
