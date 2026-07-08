import { useEffect, useMemo, useState } from "react";
import { buildDeliveryFeeEstimate, DELIVERY_FEE_PENDING_MESSAGE, type DeliveryFeeEstimate } from "@/lib/deliveryFeeEstimate";
import { fetchTariffsCatalog } from "@/lib/api/tariffs";

const unavailableEstimate: DeliveryFeeEstimate = {
  available: false,
  zoneDeliveryFee: null,
  neighborhoodEntryFee: null,
  expressSupplement: null,
  total: null,
  pendingMessage: DELIVERY_FEE_PENDING_MESSAGE,
};

export function useDeliveryFeeEstimate(destinationQuartier: string, express: "yes" | "no") {
  const [estimate, setEstimate] = useState<DeliveryFeeEstimate>(unavailableEstimate);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quartierKey = destinationQuartier.trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const catalog = await fetchTariffsCatalog();
        if (!mounted) return;
        setEstimate(
          buildDeliveryFeeEstimate({
            zones: catalog.zones,
            neighborhoods: catalog.neighborhoods,
            settings: catalog.settings,
            destinationQuartier,
            express,
          }),
        );
      } catch (e: unknown) {
        if (!mounted) return;
        setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
        setEstimate(unavailableEstimate);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [destinationQuartier, express, quartierKey]);

  return useMemo(() => ({ estimate, loading, error }), [estimate, loading, error]);
}
