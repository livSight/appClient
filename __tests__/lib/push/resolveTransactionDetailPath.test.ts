jest.mock("@/lib/api/transactions", () => ({
  getTransactionById: jest.fn(),
  getTransactionNavigationId: (tx: { id?: number; transactionReference?: string }) =>
    tx.transactionReference ?? String(tx.id ?? ""),
}));

import { getTransactionById } from "@/lib/api/transactions";
import { resolveTransactionDetailPath } from "@/lib/push/resolveTransactionDetailPath";

const mockGetTransactionById = getTransactionById as jest.Mock;

describe("resolveTransactionDetailPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns livraison detail for delivery orders", async () => {
    mockGetTransactionById.mockResolvedValueOnce({
      id: 1001,
      type: "delivery",
      transactionReference: "LVS-1",
    });

    await expect(resolveTransactionDetailPath("1001")).resolves.toBe("/livraison-detail/LVS-1");
  });

  it("returns expedition detail for expedition orders", async () => {
    mockGetTransactionById.mockResolvedValueOnce({
      id: 2002,
      type: "expedition",
      transactionReference: "LVS-EXP",
    });

    await expect(resolveTransactionDetailPath("2002")).resolves.toBe("/expedition-detail/LVS-EXP");
  });

  it("falls back to livraison detail when lookup fails", async () => {
    mockGetTransactionById.mockRejectedValueOnce(new Error("404"));

    await expect(resolveTransactionDetailPath("999")).resolves.toBe("/livraison-detail/999");
  });
});
