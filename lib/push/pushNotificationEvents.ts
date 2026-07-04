import type { PushReceivedPayload } from "@/lib/push/notificationRouting";

type PushReceivedListener = (payload: PushReceivedPayload) => void;

const listeners = new Set<PushReceivedListener>();

export function onPushReceived(listener: PushReceivedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitPushReceived(payload: PushReceivedPayload): void {
  listeners.forEach((listener) => listener(payload));
}
