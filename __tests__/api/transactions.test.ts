jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
  },
}));

jest.mock("@/lib/api/transactionImage", () => ({
  getDefaultTransactionImagePart: jest.fn(() => ({
    uri: "file://placeholder-transaction.png",
    name: "placeholder-transaction.png",
    type: "image/png",
  })),
}));

import { apiFetch } from "@/lib/api/client";
import { authSession } from "@/lib/auth/session";
import { getDefaultTransactionImagePart } from "@/lib/api/transactionImage";
import {
  buildTransactionFormData,
  createTransaction,
  getTransactionById,
  listTransactions,
  resolveApiSourceField,
  type TransactionRequest,
} from "@/lib/api/transactions";

const API_BASE = "http://156.67.27.35:8085";
const KEYCLOAK_ID = "5785160a-6c5c-44d5-96fd-d28aa677d8d4";

const mockGetSessionUser = authSession.getSessionUser as jest.Mock;
const mockGetDefaultTransactionImagePart = getDefaultTransactionImagePart as jest.Mock;

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
  source: "instocke",
  type: "delivery",
  quantity: 1,
  amount: 1500,
  status: "pending",
  cash_collect: false,
  serviceLevel: "standard",
};

describe("resolveApiSourceField", () => {
  it("omits source on POST until backend enum strings are confirmed", () => {
    expect(resolveApiSourceField("instocke")).toBeUndefined();
    expect(resolveApiSourceField("pick_up")).toBeUndefined();
  });
});

describe("buildTransactionFormData", () => {
  beforeEach(() => {
    mockGetDefaultTransactionImagePart.mockClear();
  });

  it("does not append invalid source values", () => {
    const form = buildTransactionFormData(sampleRequest);
    expect(form.get("source")).toBeNull();
    expect(form.get("package_name")).toBe("Colis test");
    expect(form.get("type")).toBe("delivery");
  });

  it("always includes a placeholder image when imageUri is missing", () => {
    buildTransactionFormData(sampleRequest);
    expect(mockGetDefaultTransactionImagePart).toHaveBeenCalledTimes(1);
  });

  it("uses the provided imageUri instead of the placeholder", () => {
    mockGetDefaultTransactionImagePart.mockClear();
    buildTransactionFormData({
      ...sampleRequest,
      imageUri: "file:///data/user/photo.jpg",
    });
    expect(mockGetDefaultTransactionImagePart).not.toHaveBeenCalled();
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
    it("returns all transactions from the authenticated API response", async () => {
      mockApiResponse(200, [
        {
          package_name: "Mine",
          user_id: 3,
          type: "delivery",
          transactionReference: "LVS-AAA",
          destination: { street: "Bastos" },
        },
        {
          package_name: "Other",
          user_id: 5,
          type: "delivery",
          transactionReference: "LVS-BBB",
          destination: { street: "Akwa" },
        },
      ]);

      const result = await listTransactions();

      expect(apiFetch).toHaveBeenCalledWith(`${API_BASE}/api/transactions`, { method: "GET" });
      expect(result).toHaveLength(2);
      expect(result[0].package_name).toBe("Mine");
      expect(result[1].package_name).toBe("Other");
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
