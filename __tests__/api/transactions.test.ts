jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
  },
}));

import { apiFetch } from "@/lib/api/client";
import { authSession } from "@/lib/auth/session";
import {
  buildPayloadFromPickupResume,
  buildPayloadFromStockResume,
  buildTransactionFormData,
  createTransaction,
  getTransactionById,
  listTransactions,
  parseTransaction,
  resolveApiSourceField,
  type TransactionRequest,
} from "@/lib/api/transactions";

const API_BASE = "http://localhost:4040";
const KEYCLOAK_ID = "5785160a-6c5c-44d5-96fd-d28aa677d8d4";

const mockGetSessionUser = authSession.getSessionUser as jest.Mock;

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  (apiFetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

const sampleRequest: TransactionRequest = {
  package_name: "Colis test",
  description: "Description test",
  destination_street: "Bastos",
  receiver_name: "Client",
  receiver_phone: "670000000",
  source: "stock",
  type: "delivery",
  quantity: 1,
  amount: 1500,
  status: "pending",
  cash_collect: false,
  serviceLevel: "standard",
};

describe("buildPayloadFromPickupResume", () => {
  it("uses type delivery for livraison ramassage with source pickup", () => {
    const payload = buildPayloadFromPickupResume({
      forExpedition: false,
      packageName: "Fort",
      description: "Ramassage: Mimboman — Sac",
      phone: "658478764",
      express: "no",
      collectCash: "no",
      amount: 0,
      quantity: 1,
      pickupStreet: "Mimboman",
      dropoffStreet: "Sac",
    });
    expect(payload.type).toBe("delivery");
    expect(payload.source).toBe("pickup");
  });

  it("uses type expedition for expedition ramassage", () => {
    const payload = buildPayloadFromPickupResume({
      forExpedition: true,
      packageName: "Colis",
      description: "Ramassage: Agence",
      phone: "670000000",
      express: "no",
      collectCash: "no",
      amount: 0,
      quantity: 1,
      pickupStreet: "Agence",
      dropoffStreet: "Ville",
    });
    expect(payload.type).toBe("expedition");
    expect(payload.source).toBe("pickup");
  });
});

describe("buildPayloadFromStockResume", () => {
  it("uses type delivery and source stock for livraison stock", () => {
    const payload = buildPayloadFromStockResume({
      forExpedition: false,
      itemsLine: "Robe",
      description: "Robe x1",
      phone: "670000000",
      express: "no",
      collectCash: "no",
      amount: 0,
      quantity: 1,
      destinationQuartier: "Bastos",
      destinationLandmark: "",
      departureStreet: "Agence | Ongola Express",
    });
    expect(payload.type).toBe("delivery");
    expect(payload.source).toBe("stock");
  });
});

describe("parseTransaction mode inference", () => {
  it("infers pickup mode for delivery when description starts with Ramassage:", () => {
    const tx = parseTransaction({
      type: "delivery",
      description: "Ramassage: Mimboman — Sac",
      package_name: "Fort",
    });
    expect(tx.mode).toBe("pickup");
  });

  it("infers stock mode for delivery without ramassage description", () => {
    const tx = parseTransaction({
      type: "delivery",
      description: "Robe x1",
      package_name: "Robe",
    });
    expect(tx.mode).toBe("stock");
  });

  it("infers pickup mode for legacy type pickup rows", () => {
    const tx = parseTransaction({ type: "pickup", package_name: "Sac" });
    expect(tx.mode).toBe("pickup");
  });
});

describe("resolveApiSourceField", () => {
  it("passes through backend Source enum values pickup and stock", () => {
    expect(resolveApiSourceField("stock")).toBe("stock");
    expect(resolveApiSourceField("pickup")).toBe("pickup");
  });
});

describe("buildTransactionFormData", () => {
  it("appends source pickup or stock on POST", () => {
    const form = buildTransactionFormData(sampleRequest);
    expect(form.get("source")).toBe("stock");
    expect(form.get("package_name")).toBe("Colis test");
    expect(form.get("type")).toBe("delivery");
  });

  it("omits image when imageUri is missing", () => {
    const form = buildTransactionFormData(sampleRequest);
    expect(form.get("image")).toBeNull();
  });

  it("appends image when imageUri is provided", () => {
    const appendSpy = jest.spyOn(FormData.prototype, "append");
    buildTransactionFormData({
      ...sampleRequest,
      imageUri: "file:///data/user/photo.jpg",
    });
    expect(appendSpy).toHaveBeenCalledWith(
      "image",
      expect.objectContaining({
        uri: "file:///data/user/photo.jpg",
        name: "photo.jpg",
        type: "image/jpeg",
      }),
    );
    appendSpy.mockRestore();
  });
});

describe("transactions API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSessionUser.mockResolvedValue({
      keycloakId: KEYCLOAK_ID,
      email: "snake123@example.com",
    });
  });

  describe("listTransactions", () => {
    it("GETs /api/users/transactions?keycloakId= for the session user", async () => {
      mockApiResponse(200, [
        {
          package_name: "Mine",
          user_id: 3,
          type: "delivery",
          transactionReference: "LVS-AAA",
          destination: { street: "Bastos" },
        },
        {
          package_name: "WhatsApp order",
          user_id: 3,
          type: "delivery",
          source: "stock",
          transactionReference: "LVS-BBIHDBBBEF",
          destination: { street: "Makepe" },
        },
      ]);

      const result = await listTransactions();

      expect(apiFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/users/transactions?keycloakId=${encodeURIComponent(KEYCLOAK_ID)}`,
        { method: "GET" },
      );
      expect(result).toHaveLength(2);
      expect(result[0].package_name).toBe("Mine");
      expect(result[1].transactionReference).toBe("LVS-BBIHDBBBEF");
    });

    it("throws when there is no authenticated session", async () => {
      mockGetSessionUser.mockResolvedValue(null);

      await expect(listTransactions()).rejects.toThrow("Session expirée");
      expect(apiFetch).not.toHaveBeenCalled();
    });

    it("throws when apiFetch returns an error status", async () => {
      mockApiResponse(500, { message: "Server error" });

      await expect(listTransactions()).rejects.toThrow("Server error");
    });
  });

  describe("createTransaction", () => {
    it("POSTs multipart with Bearer (via apiFetch) and X-User-Id keycloak header", async () => {
      mockApiResponse(200, { message: "Transaction created successfully" });
      mockApiResponse(200, [
        {
          package_name: "Colis test",
          user_id: 3,
          type: "delivery",
          status: "pending",
          transactionReference: "LVS-NEW",
          destination: { street: "Bastos" },
        },
      ]);

      await createTransaction(sampleRequest);

      expect(apiFetch).toHaveBeenCalledTimes(2);
      const [url, init] = (apiFetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${API_BASE}/api/transactions`);
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      expect(init.headers).toEqual({ "X-User-Id": KEYCLOAK_ID });
    });

    it("throws when there is no authenticated session", async () => {
      mockGetSessionUser.mockResolvedValue(null);

      await expect(createTransaction(sampleRequest)).rejects.toThrow("Session expirée");
      expect(apiFetch).not.toHaveBeenCalled();
    });

    it("throws when create fails", async () => {
      mockApiResponse(404, "User not found");

      await expect(createTransaction(sampleRequest)).rejects.toThrow("User not found");
    });

    it("returns the created transaction from a refreshed list when POST only returns a message", async () => {
      mockApiResponse(200, { message: "Transaction created successfully" });
      mockApiResponse(200, [
        {
          package_name: "Colis test",
          user_id: 3,
          type: "delivery",
          status: "pending",
          transactionReference: "LVS-NEWREF",
          destination: { street: "Bastos" },
        },
      ]);

      const created = await createTransaction(sampleRequest);

      expect(apiFetch).toHaveBeenCalledTimes(2);
      expect(created.transactionReference).toBe("LVS-NEWREF");
    });
  });

  describe("getTransactionById", () => {
    it("uses reference endpoint when id is LVS-*", async () => {
      mockApiResponse(200, {
        package_name: "Ref txn",
        user_id: 3,
        type: "delivery",
        transactionReference: "LVS-JFCIIJIDDJ",
        destination: { street: "Makepe" },
        receiverData: { name: "Client", phone: "670000000" },
      });

      const tx = await getTransactionById("LVS-JFCIIJIDDJ");

      expect(apiFetch).toHaveBeenCalledWith(
        `${API_BASE}/api/transactions/reference?transactionReference=LVS-JFCIIJIDDJ`,
        { method: "GET" },
      );
      expect(tx.transactionReference).toBe("LVS-JFCIIJIDDJ");
      expect(tx.receiver_phone).toBe("670000000");
    });

    it("uses numeric id endpoint for non-reference ids", async () => {
      mockApiResponse(200, {
        id: 1,
        package_name: "Numeric txn",
        user_id: 3,
        type: "delivery",
        destination: { street: "Essos" },
      });

      const tx = await getTransactionById(1);

      expect(apiFetch).toHaveBeenCalledWith(`${API_BASE}/api/transactions/1`, { method: "GET" });
      expect(tx.package_name).toBe("Numeric txn");
    });

    it("throws when detail fetch fails", async () => {
      mockApiResponse(404, "Not found");

      await expect(getTransactionById("999")).rejects.toThrow("Not found");
    });
  });
});
