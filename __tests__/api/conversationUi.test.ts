import { mapConversationToTransactionCardItem, mapTransactionToConversationItem } from "@/lib/api/conversationUi";
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
    expect(item?.locationLine).toBe("Yaoundé → Douala · Buca Voyage");
    expect(item?.type).toBe("expedition");
  });

  it("returns null when transaction has no navigation id", () => {
    expect(mapTransactionToConversationItem(baseTx({ transactionReference: undefined, id: undefined }))).toBeNull();
  });
});

describe("mapConversationToTransactionCardItem", () => {
  it("maps conversation list rows to TransactionCard fields", () => {
    const card = mapConversationToTransactionCardItem({
      id: "1001",
      refLabel: "REF: LVS-1",
      timeLabel: "il y a 2 h",
      type: "livraison",
      title: "Sac x2",
      locationLine: "Akwa",
      subtitle: "Support : Le coursier arrive",
      isUnread: true,
      unreadCount: 1,
    });

    expect(card.ref).toBe("LVS-1");
    expect(card.title).toBe("Sac x2");
    expect(card.quartier).toBe("Akwa");
    expect(card.dateLabel).toBe("il y a 2 h");
    expect(card.statusLabel).toBe("1 NON LU");
    expect(card.paymentLabel).toBe("Support : Le coursier arrive");
    expect(card.serviceLabel).toBe("Livraison");
  });

  it("shows plural count when multiple unread messages", () => {
    const card = mapConversationToTransactionCardItem({
      id: "1001",
      refLabel: "REF: LVS-1",
      timeLabel: "il y a 2 h",
      type: "livraison",
      title: "Sac x2",
      locationLine: "Akwa",
      subtitle: "Support : Le coursier arrive",
      isUnread: true,
      unreadCount: 3,
    });
    expect(card.statusLabel).toBe("3 NON LUS");
  });

  it("shows MESSAGES when read", () => {
    const card = mapConversationToTransactionCardItem({
      id: "1001",
      refLabel: "REF: LVS-1",
      timeLabel: "il y a 2 h",
      type: "livraison",
      title: "Sac x2",
      locationLine: "Akwa",
      subtitle: "Vous : Mon colis est prêt",
      isUnread: false,
    });
    expect(card.statusLabel).toBe("MESSAGES");
  });
});
