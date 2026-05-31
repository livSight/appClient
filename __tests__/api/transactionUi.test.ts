import {
  filterTransactionsForUser,
  mapTransactionToCardItem,
  serviceLabelFromType,
  sourceLabelFromTransaction,
  sortTransactionsForDisplay,
} from "@/lib/api/transactionUi";
import type { Transaction } from "@/lib/api/transactions";

const baseTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  package_name: "Sac",
  type: "pickup",
  status: "pending",
  transactionReference: "LVS-AAAA111111",
  user_id: 3,
  amount: 0,
  destination: { street: "Makepe — Yaoundé" },
  ...overrides,
});

describe("transactionUi", () => {
  describe("serviceLabelFromType", () => {
    it("maps delivery, expedition, and legacy pickup", () => {
      expect(serviceLabelFromType("delivery")).toBe("Livraison");
      expect(serviceLabelFromType("expedition")).toBe("Expédition");
      expect(serviceLabelFromType("pickup")).toBe("Livraison");
    });
  });

  describe("sourceLabelFromTransaction", () => {
    it("prefers backend source over type", () => {
      expect(sourceLabelFromTransaction(baseTx({ source: "pickup", type: "delivery" }))).toBe("Ramassage");
      expect(sourceLabelFromTransaction(baseTx({ source: "stock", type: "delivery" }))).toBe("En stock");
      expect(sourceLabelFromTransaction(baseTx({ source: "pick_up", type: "delivery" }))).toBe("Ramassage");
      expect(sourceLabelFromTransaction(baseTx({ source: "instocke", type: "delivery" }))).toBe("En stock");
    });

    it("uses Ramassage: description prefix when source is null", () => {
      expect(
        sourceLabelFromTransaction(
          baseTx({ source: null, type: "delivery", description: "Ramassage: Mimboman — Sac" }),
        ),
      ).toBe("Ramassage");
    });

    it("falls back to mode then legacy type pickup when source is null", () => {
      expect(sourceLabelFromTransaction(baseTx({ source: null, type: "pickup", mode: undefined }))).toBe("Ramassage");
      expect(sourceLabelFromTransaction(baseTx({ source: null, type: "delivery", mode: "stock" }))).toBe("En stock");
    });
  });

  describe("mapTransactionToCardItem", () => {
    it("maps delivery + stock to two distinct pills", () => {
      const item = mapTransactionToCardItem(baseTx({ type: "delivery", source: "stock" }));
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("En stock");
    });

    it("maps delivery + pickup to Livraison and Ramassage", () => {
      const item = mapTransactionToCardItem(baseTx({ type: "delivery", source: "pickup" }));
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("Ramassage");
    });

    it("maps delivery + legacy instocke to two distinct pills", () => {
      const item = mapTransactionToCardItem(baseTx({ type: "delivery", source: "instocke" }));
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("En stock");
      expect(item.isExpedition).toBe(false);
    });

    it("maps delivery + legacy pick_up to Livraison and Ramassage", () => {
      const item = mapTransactionToCardItem(baseTx({ type: "delivery", source: "pick_up" }));
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("Ramassage");
    });

    it("maps expedition + pickup to Expédition and Ramassage", () => {
      const item = mapTransactionToCardItem(baseTx({ type: "expedition", source: "pickup", transactionReference: "LVS-EXP" }));
      expect(item.serviceLabel).toBe("Expédition");
      expect(item.sourceLabel).toBe("Ramassage");
      expect(item.isExpedition).toBe(true);
    });

    it("maps legacy type pickup (Fort/Sac) to Livraison and Ramassage", () => {
      const item = mapTransactionToCardItem(
        baseTx({
          type: "pickup",
          source: null,
          package_name: "Fort",
          description: "Ramassage: Mimboman — Sac",
        }),
      );
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("Ramassage");
    });

    it("maps delivery with Ramassage description to Livraison and Ramassage", () => {
      const item = mapTransactionToCardItem(
        baseTx({
          type: "delivery",
          source: null,
          description: "Ramassage: Mimboman — Sac",
          mode: "pickup",
        }),
      );
      expect(item.serviceLabel).toBe("Livraison");
      expect(item.sourceLabel).toBe("Ramassage");
    });

    it("omits amount and payment when not collecting cash", () => {
      const item = mapTransactionToCardItem(baseTx({ cash_collect: false, amount: 0 }));
      expect(item.amountLabel).toBeUndefined();
      expect(item.paymentLabel).toBeUndefined();
      expect(item.quartier).toBe("Makepe");
    });

    it("shows amount and ESPÈCES when collecting cash", () => {
      const item = mapTransactionToCardItem(baseTx({ cash_collect: true, amount: 5000 }));
      expect(item.amountLabel).toBe("5 000 FCFA");
      expect(item.paymentLabel).toBe("ESPÈCES");
    });

    it("sets express label from serviceLevel", () => {
      const item = mapTransactionToCardItem(baseTx({ serviceLevel: "express", type: "delivery", source: "stock" }));
      expect(item.expressLabel).toBe("Express");
    });

    it("uses En cours status label aligned with filters", () => {
      const item = mapTransactionToCardItem(baseTx({ status: "pending" }));
      expect(item.status).toBe("En cours");
      expect(item.statusLabel).toBe("En cours");
    });

    it("formats ref without leading hash", () => {
      const item = mapTransactionToCardItem(baseTx({ transactionReference: "LVS-TEST123456" }));
      expect(item.ref).toBe("LVS-TEST123456");
    });
  });

  it("filters transactions to the signed-in user", () => {
    const txns = [baseTx({ user_id: 3 }), baseTx({ user_id: 5, transactionReference: "LVS-BBBB222222" })];
    expect(filterTransactionsForUser(txns, 3)).toHaveLength(1);
    expect(filterTransactionsForUser(txns, 3)[0]?.user_id).toBe(3);
  });

  it("sorts by created_at descending when available", () => {
    const txns = [
      baseTx({ created_at: "2026-01-01T00:00:00.000Z", transactionReference: "LVS-OLD" }),
      baseTx({ created_at: "2026-05-01T00:00:00.000Z", transactionReference: "LVS-NEW" }),
    ];
    const sorted = sortTransactionsForDisplay(txns);
    expect(sorted[0]?.transactionReference).toBe("LVS-NEW");
  });

  it("falls back to reverse API order when dates are missing", () => {
    const txns = [
      baseTx({ transactionReference: "LVS-OLDEST" }),
      baseTx({ transactionReference: "LVS-MIDDLE" }),
      baseTx({ transactionReference: "LVS-NEWEST" }),
    ];
    const sorted = sortTransactionsForDisplay(txns);
    expect(sorted.map((t) => t.transactionReference)).toEqual(["LVS-NEWEST", "LVS-MIDDLE", "LVS-OLDEST"]);
  });
});
