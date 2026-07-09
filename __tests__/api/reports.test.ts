jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
    getAccessToken: jest.fn(),
  },
}));

import { apiFetch } from "@/lib/api/client";
import { authSession } from "@/lib/auth/session";
import {
  buildReportPdfRequest,
  fetchDeliveryReport,
  sourceCountsFromDeliveries,
  statusBucketsFromSummary,
  toReportDateParam,
} from "@/lib/api/reports";

const API_BASE = "http://localhost:4040";
const KEYCLOAK_ID = "5785160a-6c5c-44d5-96fd-d28aa677d8d4";

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  (apiFetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

describe("toReportDateParam", () => {
  it("formats local dates as YYYY-MM-DD", () => {
    expect(toReportDateParam(new Date(2026, 6, 9, 15, 30))).toBe("2026-07-09");
    expect(toReportDateParam(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
});

describe("statusBucketsFromSummary", () => {
  it("folds every backend status into the four UI buckets", () => {
    const buckets = statusBucketsFromSummary([
      { status: "completed", count: 3 },
      { status: "collected_at_office", count: 1 },
      { status: "pending", count: 2 },
      { status: "processing", count: 1 },
      { status: "events", count: 1 },
      { status: "postponed", count: 2 },
      { status: "client_absent", count: 1 },
      { status: "unreachable", count: 1 },
      { status: "does_not_pick_up", count: 1 },
      { status: "failed", count: 2 },
    ]);

    expect(buckets).toEqual({ delivered: 4, enCours: 4, injoignable: 5, annule: 2 });
  });

  it("handles empty or missing summaries", () => {
    expect(statusBucketsFromSummary(undefined)).toEqual({ delivered: 0, injoignable: 0, annule: 0, enCours: 0 });
    expect(statusBucketsFromSummary([])).toEqual({ delivered: 0, injoignable: 0, annule: 0, enCours: 0 });
  });
});

describe("sourceCountsFromDeliveries", () => {
  it("counts stock and pickup lines including legacy spellings", () => {
    const counts = sourceCountsFromDeliveries([
      { source: "stock" },
      { source: "instocke" },
      { source: "pickup" },
      { source: "pick_up" },
      { source: null },
    ]);
    expect(counts).toEqual({ stock: 2, pickup: 2 });
  });
});

describe("fetchDeliveryReport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authSession.getSessionUser as jest.Mock).mockResolvedValue({ keycloakId: KEYCLOAK_ID });
  });

  it("GETs /api/reports/deliveries with date params and X-User-Id", async () => {
    mockApiResponse(200, { delivery_count: 4, total_encaisse: 20000 });

    const report = await fetchDeliveryReport("2026-07-01", "2026-07-09");

    expect(apiFetch).toHaveBeenCalledWith(
      `${API_BASE}/api/reports/deliveries?start_date=2026-07-01&end_date=2026-07-09`,
      { method: "GET", headers: { "X-User-Id": KEYCLOAK_ID } },
    );
    expect(report.delivery_count).toBe(4);
    expect(report.total_encaisse).toBe(20000);
  });

  it("unwraps a { data } envelope", async () => {
    mockApiResponse(200, { data: { delivery_count: 2 } });

    const report = await fetchDeliveryReport("2026-07-01", "2026-07-09");
    expect(report.delivery_count).toBe(2);
  });

  it("throws the API message on failure", async () => {
    mockApiResponse(400, { message: "Invalid date range" });

    await expect(fetchDeliveryReport("2026-07-09", "2026-07-01")).rejects.toThrow("Invalid date range");
  });

  it("throws when there is no session", async () => {
    (authSession.getSessionUser as jest.Mock).mockResolvedValue(null);

    await expect(fetchDeliveryReport("2026-07-01", "2026-07-09")).rejects.toThrow("Session expirée");
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe("buildReportPdfRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authSession.getSessionUser as jest.Mock).mockResolvedValue({ keycloakId: KEYCLOAK_ID });
    (authSession.getAccessToken as jest.Mock).mockResolvedValue("token-123");
  });

  it("builds the authenticated PDF URL with download=true", async () => {
    const req = await buildReportPdfRequest("deliveries", "2026-07-01", "2026-07-09");

    expect(req.url).toBe(
      `${API_BASE}/api/reports/deliveries/pdf?start_date=2026-07-01&end_date=2026-07-09&download=true`,
    );
    expect(req.headers).toEqual({ "X-User-Id": KEYCLOAK_ID, Authorization: "Bearer token-123" });
    expect(req.fileName).toBe("LivSight_Rapport-Livraisons_2026-07-01_au_2026-07-09.pdf");
  });
});
