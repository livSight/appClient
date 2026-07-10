import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { computeTotalUnreadCount } from "@/lib/api/inbox";
import { useAuth } from "@/lib/auth/AuthProvider";
import { featureFlags } from "@/lib/featureFlags";
import { shouldRefreshConversations } from "@/lib/push/notificationRouting";
import { usePushRefresh } from "@/lib/push/usePushRefresh";

type UnreadCountContextValue = {
  totalUnread: number;
  setTotalUnread: (n: number) => void;
  /** Full recount (network). Fired at login/app start and on message push. */
  refreshUnread: () => Promise<void>;
};

const defaultValue: UnreadCountContextValue = {
  totalUnread: 0,
  setTotalUnread: () => {},
  refreshUnread: async () => {},
};

const UnreadCountContext = createContext<UnreadCountContextValue>(defaultValue);

/** Must be nested inside AuthProvider. */
export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!featureFlags.messagingEnabled) return;
    if (!isAuthenticated) return;
    try {
      setTotalUnread(await computeTotalUnreadCount());
    } catch {
      // keep the last known badge on transient errors
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!featureFlags.messagingEnabled) {
      setTotalUnread(0);
      return;
    }
    if (!isAuthenticated) {
      setTotalUnread(0);
      return;
    }
    void refreshUnread();
  }, [isAuthenticated, refreshUnread]);

  usePushRefresh(
    useCallback((payload) => (featureFlags.messagingEnabled ? shouldRefreshConversations(payload) : false), []),
    useCallback(() => {
      void refreshUnread();
    }, [refreshUnread]),
  );

  const value = useMemo<UnreadCountContextValue>(
    () => ({ totalUnread, setTotalUnread, refreshUnread }),
    [totalUnread, refreshUnread],
  );

  return <UnreadCountContext.Provider value={value}>{children}</UnreadCountContext.Provider>;
}

export function useUnreadCount(): UnreadCountContextValue {
  return useContext(UnreadCountContext);
}
