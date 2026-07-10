import {
  buildDeliveryFeeEstimate,
  DELIVERY_FEE_PENDING_MESSAGE,
  findNeighborhoodByName,
  resolveZoneDeliveryFee,
} from "@/lib/deliveryFeeEstimate";

describe("deliveryFeeEstimate", () => {
  const zones = [
    { id: 10, city_id: 1, delivery_fee: 1500, sort_order: 1, distance_label: null, eta_label: null },
    { id: 11, city_id: 1, delivery_fee: 2000, sort_order: 2, distance_label: null, eta_label: null },
  ];

  const neighborhoods = [
    { id: 1, zone_id: 10, name: "Bastos", delivery_fee: 500, requires_entry_fee: true },
    { id: 2, zone_id: 11, name: "Mvan", delivery_fee: null, requires_entry_fee: false },
  ];

  const settings = { pickup_fee: 500, express_fee: 1000, client_absent_fee_percent: 30 };

  it("findNeighborhoodByName matches case-insensitively", () => {
    expect(findNeighborhoodByName(neighborhoods, " bastos ")?.id).toBe(1);
    expect(findNeighborhoodByName(neighborhoods, "Unknown")).toBeNull();
  });

  it("resolveZoneDeliveryFee reads zone delivery_fee", () => {
    expect(resolveZoneDeliveryFee(zones, 10)).toBe(1500);
    expect(resolveZoneDeliveryFee(zones, 999)).toBeNull();
  });

  it("buildDeliveryFeeEstimate sums zone, entry and express fees", () => {
    const estimate = buildDeliveryFeeEstimate({
      zones,
      neighborhoods,
      settings,
      destinationQuartier: "Bastos",
      express: "yes",
    });
    expect(estimate.available).toBe(true);
    expect(estimate.zoneDeliveryFee).toBe(1500);
    expect(estimate.neighborhoodEntryFee).toBe(500);
    expect(estimate.expressSupplement).toBe(1000);
    expect(estimate.total).toBe(3000);
  });

  it("buildDeliveryFeeEstimate excludes express when not selected", () => {
    const estimate = buildDeliveryFeeEstimate({
      zones,
      neighborhoods,
      settings,
      destinationQuartier: "Mvan",
      express: "no",
    });
    expect(estimate.available).toBe(true);
    expect(estimate.zoneDeliveryFee).toBe(2000);
    expect(estimate.neighborhoodEntryFee).toBeNull();
    expect(estimate.expressSupplement).toBeNull();
    expect(estimate.total).toBe(2000);
  });

  it("buildDeliveryFeeEstimate is unavailable when quartier is unknown", () => {
    const estimate = buildDeliveryFeeEstimate({
      zones,
      neighborhoods,
      settings,
      destinationQuartier: "Essos",
      express: "no",
    });
    expect(estimate.available).toBe(false);
    expect(estimate.pendingMessage).toBe(DELIVERY_FEE_PENDING_MESSAGE);
  });

  it("buildDeliveryFeeEstimate is unavailable when express is selected but fee settings missing", () => {
    const estimate = buildDeliveryFeeEstimate({
      zones,
      neighborhoods,
      settings: null,
      destinationQuartier: "Mvan",
      express: "yes",
    });
    expect(estimate.available).toBe(false);
  });
});
