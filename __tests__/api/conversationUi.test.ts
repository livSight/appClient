import { mapTransactionToConversationItem } from "@/lib/api/conversationUi";
import type { Transaction } from "@/lib/api/transactions";

const baseTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  package_name: "Sac",
  type: "delivery",
  status: "pending",
  transactionReference: "LVS-AAAA111111",
  user_id: 3,
  amount: 0,
  destination: { street: "Makepe — Yaoundé" },
  description: "Sac x1",
  ...overrides,
});

describe("mapTransactionToConversationItem", () => {
  it("uses package_name as title for livraison (not quartier)", () => {
    const item = mapTransactionToConversationItem(
      baseTx({
        package_name: "2 robes + 1 sac",
        description: "2 robes + 1 sac",
        destination: { street: "Makepe" },
      }),
    );

    expect(item?.title).toBe("2 robes + 1 sac");
    expect(item?.locationLine).toBe("Makepe");
    expect(item?.type).toBe("livraison");
  });

  it("appends quantity to title when qty > 1", () => {
    const item = mapTransactionToConversationItem(
      baseTx({ package_name: "Robe", quantity: 3, destination: { street: "Bastos" } }),
    );

    expect(item?.title).toBe("Robe x3");
  });

  it("uses package_name as title for expedition with trajet as locationLine", () => {
    const item = mapTransactionToConversationItem(
      baseTx({
        type: "expedition",
        package_name: "Colis fragile",
        departure: { city: "Yaoundé", region: "Buca Voyage" },
        destination: { city: "Douala" },
      }),
    );

    expect(item?.title).toBe("Colis fragile");
    expect(item?.locationLine).toBe("Yaoundé → Douala");
    expect(item?.agence).toBe("Buca Voyage");
    expect(item?.type).toBe("expedition");
  });

  it("returns null when transaction has no navigation id", () => {
    expect(mapTransactionToConversationItem(baseTx({ transactionReference: undefined, id: undefined }))).toBeNull();
  });
});
