import type { Notification } from "expo-notifications";

/**
 * Parse delivery id from Expo Push `data` (align with backend payload).
 */
export function parseDeliveryIdFromNotificationData(
  data: Record<string, unknown> | null | undefined,
): string | null {
  if (!data || typeof data !== "object") return null;

  const raw = data.deliveryId ?? data.delivery_id;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "string" && raw.trim()) return raw.trim();

  const url = data.url;
  if (typeof url === "string") {
    const m = url.match(/livraison-detail\/([^/?#]+)/);
    if (m?.[1]) return m[1];
  }

  return null;
}

export function getDataFromNotification(
  n: Notification,
): Record<string, unknown> | undefined {
  const c = n.request.content;
  const data = c.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return undefined;
}
