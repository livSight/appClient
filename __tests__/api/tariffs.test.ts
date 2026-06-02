jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from "@/lib/api/client";
import {
  getDeliveryFeeSettings,
  getDeliveryFeeZone,
  listCities,
  listDeliveryFeeZones,
  listNeighborhoods,
} from "@/lib/api/tariffs";
import {
  buildOtherTariffs,
  formatSupplementFcfaLabel,
  mapZoneToTariffCard,
  pickDefaultCityId,
  resolveDeliveryFeeAmounts,
  zoneDisplayLabel,
} from "@/lib/api/tariffUi";

const API_BASE = "http://156.67.27.35:8085";

const mockApiFetch = apiFetch as jest.Mock;

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  mockApiFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

describe("tariffs API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("listCities GETs /api/cities", async () => {
    mockApiResponse(200, [{ id: 1, name: "Yaoundé" }]);
    const cities = await listCities();
    expect(mockApiFetch).toHaveBeenCalledWith(`${API_BASE}/api/cities`, { method: "GET" });
    expect(cities).toEqual([{ id: 1, name: "Yaoundé" }]);
  });

  it("listDeliveryFeeZones GETs /api/delivery-fee-zones", async () => {
    mockApiResponse(200, [
      {
        id: 10,
        city_id: 1,
        delivery_fee: 1000,
        sort_order: 1,
        distance_label: "0 – 4 km",
        eta_label: "~30 min",
      },
    ]);
    const zones = await listDeliveryFeeZones();
    expect(mockApiFetch).toHaveBeenCalledWith(`${API_BASE}/api/delivery-fee-zones`, { method: "GET" });
    expect(zones[0].delivery_fee).toBe(1000);
  });

  it("getDeliveryFeeZone GETs /api/delivery-fee-zones/:id", async () => {
    mockApiResponse(200, { id: 10, city_id: 1, delivery_fee: 1500, sort_order: 2 });
    const zone = await getDeliveryFeeZone(10);
    expect(mockApiFetch).toHaveBeenCalledWith(`${API_BASE}/api/delivery-fee-zones/10`, { method: "GET" });
    expect(zone.id).toBe(10);
  });

  it("listNeighborhoods GETs /api/neighborhoods", async () => {
    mockApiResponse(200, [{ id: 5, zone_id: 10, name: "Bastos", requires_entry_fee: false }]);
    const list = await listNeighborhoods();
    expect(mockApiFetch).toHaveBeenCalledWith(`${API_BASE}/api/neighborhoods`, { method: "GET" });
    expect(list[0].name).toBe("Bastos");
  });

  it("getDeliveryFeeSettings GETs /api/delivery-fee-settings", async () => {
    mockApiResponse(200, { pickup_fee: 500, express_fee: 1000, client_absent_fee_percent: 30 });
    const settings = await getDeliveryFeeSettings();
    expect(mockApiFetch).toHaveBeenCalledWith(`${API_BASE}/api/delivery-fee-settings`, { method: "GET" });
    expect(settings?.express_fee).toBe(1000);
  });

  it("getDeliveryFeeSettings returns null on 404", async () => {
    mockApiResponse(404, { message: "Not found" });
    await expect(getDeliveryFeeSettings()).resolves.toBeNull();
  });
});

describe("tariffUi", () => {
  it("zoneDisplayLabel uses sort_order", () => {
    expect(
      zoneDisplayLabel({
        id: 1,
        city_id: 1,
        delivery_fee: 1000,
        sort_order: 2,
        distance_label: "4 – 8 km",
        eta_label: "~45 min",
      }),
    ).toBe("ZONE 2");
  });

  it("mapZoneToTariffCard maps API zone to UI card", () => {
    const card = mapZoneToTariffCard({
      id: 3,
      city_id: 1,
      delivery_fee: 2000,
      sort_order: 3,
      distance_label: "8 – 20 km",
      eta_label: "~1h",
    });
    expect(card.zoneId).toBe("3");
    expect(card.zoneLabel).toBe("ZONE 3");
    expect(card.priceXaf).toBe(2000);
    expect(card.distanceLabel).toBe("8 – 20 km");
  });

  it("pickDefaultCityId prefers Yaoundé then first city", () => {
    expect(pickDefaultCityId([{ id: 2, name: "Douala" }, { id: 1, name: "Yaoundé" }])).toBe(1);
    expect(pickDefaultCityId([{ id: 2, name: "Douala" }])).toBe(2);
  });

  it("resolveDeliveryFeeAmounts reads pickup and express from settings", () => {
    expect(resolveDeliveryFeeAmounts({ pickup_fee: 750, express_fee: 1200 })).toEqual({
      pickupFee: 750,
      expressFee: 1200,
    });
    expect(resolveDeliveryFeeAmounts(null)).toEqual({ pickupFee: null, expressFee: null });
  });

  it("formatSupplementFcfaLabel prefixes plus sign", () => {
    expect(formatSupplementFcfaLabel(500)).toBe("+500 FCFA");
    expect(formatSupplementFcfaLabel(null)).toBe("—");
  });

  it("buildOtherTariffs uses entry neighborhoods for quartier fee", () => {
    const items = buildOtherTariffs(
      { pickup_fee: 500, express_fee: 1000, client_absent_fee_percent: 30 },
      [{ id: 1, zone_id: 1, name: "Bastos", delivery_fee: 500, requires_entry_fee: true }],
    );
    expect(items.find((i) => i.title === "Ramassage hors stock")).toBeUndefined();
    expect(items.find((i) => i.title === "Frais de quartier")?.valueLabel).toBe("+500 FCFA");
  });
});
