import type { DeliveryFeeSettings, DeliveryFeeZone, Neighborhood } from "@/lib/api/tariffs";
import { resolveDeliveryFeeAmounts } from "@/lib/api/tariffUi";

export const DELIVERY_FEE_PENDING_MESSAGE = "Les frais de livraison seront bientôt mentionnés.";

export type DeliveryFeeEstimate = {
  available: boolean;
  zoneDeliveryFee: number | null;
  neighborhoodEntryFee: number | null;
  expressSupplement: number | null;
  total: number | null;
  pendingMessage: string;
};

export function findNeighborhoodByName(neighborhoods: Neighborhood[], quartierName: string): Neighborhood | null {
  const query = quartierName.trim().toLowerCase();
  if (!query) return null;
  return neighborhoods.find((n) => n.name?.trim().toLowerCase() === query) ?? null;
}

export function resolveZoneDeliveryFee(zones: DeliveryFeeZone[], zoneId: number): number | null {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone || !Number.isFinite(Number(zone.delivery_fee))) return null;
  return Math.max(0, Math.round(Number(zone.delivery_fee)));
}

export function resolveNeighborhoodEntryFee(neighborhood: Neighborhood): number {
  if (!neighborhood.requires_entry_fee) return 0;
  const fee = neighborhood.delivery_fee;
  if (fee == null || !Number.isFinite(Number(fee))) return 0;
  return Math.max(0, Math.round(Number(fee)));
}

export function buildDeliveryFeeEstimate(input: {
  zones: DeliveryFeeZone[];
  neighborhoods: Neighborhood[];
  settings: DeliveryFeeSettings | null;
  destinationQuartier: string;
  express: "yes" | "no";
}): DeliveryFeeEstimate {
  const pendingMessage = DELIVERY_FEE_PENDING_MESSAGE;
  const unavailable: DeliveryFeeEstimate = {
    available: false,
    zoneDeliveryFee: null,
    neighborhoodEntryFee: null,
    expressSupplement: null,
    total: null,
    pendingMessage,
  };

  const quartier = input.destinationQuartier.trim();
  if (!quartier) return unavailable;

  const neighborhood = findNeighborhoodByName(input.neighborhoods, quartier);
  if (!neighborhood) return unavailable;

  const zoneDeliveryFee = resolveZoneDeliveryFee(input.zones, neighborhood.zone_id);
  if (zoneDeliveryFee == null) return unavailable;

  const entryFee = resolveNeighborhoodEntryFee(neighborhood);
  const neighborhoodEntryFee = entryFee > 0 ? entryFee : null;

  let expressSupplement: number | null = null;
  if (input.express === "yes") {
    const { expressFee } = resolveDeliveryFeeAmounts(input.settings);
    if (expressFee == null || !Number.isFinite(expressFee)) return unavailable;
    expressSupplement = Math.max(0, Math.round(expressFee));
  }

  const total = zoneDeliveryFee + (neighborhoodEntryFee ?? 0) + (expressSupplement ?? 0);

  return {
    available: true,
    zoneDeliveryFee,
    neighborhoodEntryFee,
    expressSupplement,
    total,
    pendingMessage,
  };
}
