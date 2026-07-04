import { useEffect } from "react";
import type { PushReceivedPayload } from "@/lib/push/notificationRouting";
import { onPushReceived } from "@/lib/push/pushNotificationEvents";

export function usePushRefresh(
  shouldRefresh: (payload: PushReceivedPayload) => boolean,
  onRefresh: () => void,
): void {
  useEffect(() => {
    return onPushReceived((payload) => {
      if (shouldRefresh(payload)) {
        onRefresh();
      }
    });
  }, [shouldRefresh, onRefresh]);
}
