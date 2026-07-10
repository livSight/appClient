import { useEffect } from "react";

/**
 * Runs an async loader when it changes (typically once on mount), deferred to a
 * microtask so the loader's synchronous setState calls (e.g. setLoading(true))
 * never run inside the effect itself (react-hooks/set-state-in-effect).
 */
export function useLoadEffect(load: () => void | Promise<void>) {
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
}
