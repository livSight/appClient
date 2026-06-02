import { useCallback, useEffect, useMemo, useState } from "react";
import { getDeliveryFeeSettings, type DeliveryFeeSettings } from "@/lib/api/tariffs";
import { resolveDeliveryFeeAmounts } from "@/lib/api/tariffUi";

export function useDeliveryFeeSettings() {
  const [settings, setSettings] = useState<DeliveryFeeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDeliveryFeeSettings();
      setSettings(data);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { pickupFee, expressFee } = useMemo(() => resolveDeliveryFeeAmounts(settings), [settings]);

  return { settings, loading, error, pickupFee, expressFee, reload };
}
