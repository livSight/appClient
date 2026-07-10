import * as SecureStore from "expo-secure-store";

const KEY_PREFIX = "livsight_cr_";

const cache = new Map<string, string>();

/** Synchronous read. Returns null if never opened. */
export function getLocalReadAt(conversationId: string | number): string | null {
  return cache.get(String(conversationId)) ?? null;
}

/**
 * Call synchronously when the chat screen opens, BEFORE any API call.
 * Writes to cache instantly; persists to SecureStore in the background.
 *
 * Pass the newest loaded message's createdAt as `atLeast` after a thread load:
 * the stamp becomes max(now, atLeast) so a device clock lagging the server
 * can't leave a just-viewed message permanently "unread". The stamp never
 * moves backwards.
 */
export function setLocalReadAt(conversationId: string | number, atLeast?: string | null): void {
  const k = String(conversationId);
  const atLeastMs = atLeast ? Date.parse(atLeast) : NaN;
  const tsMs = Number.isFinite(atLeastMs) ? Math.max(Date.now(), atLeastMs) : Date.now();

  const prev = cache.get(k);
  const prevMs = prev ? Date.parse(prev) : NaN;
  if (Number.isFinite(prevMs) && prevMs >= tsMs) return;

  const ts = new Date(tsMs).toISOString();
  cache.set(k, ts);
  SecureStore.setItemAsync(`${KEY_PREFIX}${k}`, ts).catch(() => {});
}

/**
 * Warm the cache from SecureStore. Skips keys already in cache so an in-session
 * setLocalReadAt is never overwritten by stale storage.
 */
export async function hydrateLocalReadStore(ids: (string | number)[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      const k = String(id);
      if (cache.has(k)) return;
      try {
        const stored = await SecureStore.getItemAsync(`${KEY_PREFIX}${k}`);
        if (stored) cache.set(k, stored);
      } catch {
        // ignore storage errors — server flag is fallback
      }
    }),
  );
}

/** @internal Tests only */
export function resetLocalReadStoreForTests(): void {
  cache.clear();
}
