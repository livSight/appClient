export type SessionInvalidatedReason = "logout" | "expired" | "unauthorized";

type SessionInvalidatedListener = (reason: SessionInvalidatedReason) => void;

const listeners = new Set<SessionInvalidatedListener>();

export function onSessionInvalidated(listener: SessionInvalidatedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionInvalidated(reason: SessionInvalidatedReason): void {
  listeners.forEach((listener) => listener(reason));
}
