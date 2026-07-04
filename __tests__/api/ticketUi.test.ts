import type { ConversationItem } from "@/lib/api/conversationUi";
import {
  conversationMetaLine,
  enrichConversationWithTicket,
  filterConversationsWithTickets,
  formatRelativeActivityTime,
  messageSideForSender,
  pickClientTicket,
  sortConversationsByActivity,
  ticketListSubtitle,
} from "@/lib/api/ticketUi";
import type { TicketMessage, TicketResponse } from "@/lib/api/tickets";

const baseItem: ConversationItem = {
  id: "1001",
  refLabel: "REF: LVS-1",
  timeLabel: "14 juin",
  type: "livraison",
  title: "Colis",
  locationLine: "Bastos",
  subtitle: "Ouvrir la conversation",
};

const ticket: TicketResponse = {
  id: 12,
  channel: "client",
  status: "open",
  createdAt: "2026-06-14T08:00:00.000Z",
  lastUpdatedAt: "2026-06-14T12:00:00.000Z",
  isMessageRead: false,
  assignedAgent: 5,
  createdBy: 3,
  transaction: 1001,
};

describe("pickClientTicket", () => {
  it("returns the client channel ticket", () => {
    expect(pickClientTicket([ticket])).toEqual(ticket);
    expect(pickClientTicket([{ ...ticket, channel: "driver" }])).toBeNull();
  });
});

describe("formatRelativeActivityTime", () => {
  const now = new Date("2026-06-14T14:00:00.000Z");

  it("returns relative minutes for recent activity", () => {
    expect(formatRelativeActivityTime("2026-06-14T13:30:00.000Z", now)).toBe("il y a 30 min");
  });

  it("returns Hier for yesterday", () => {
    expect(formatRelativeActivityTime("2026-06-13T18:00:00.000Z", now)).toBe("Hier");
  });
});

describe("conversationMetaLine", () => {
  it("joins ref and service type", () => {
    expect(conversationMetaLine(baseItem)).toBe("REF: LVS-1 · LIVRAISON");
    expect(conversationMetaLine({ ...baseItem, type: "expedition" })).toBe("REF: LVS-1 · EXPÉDITION");
  });
});

describe("ticketListSubtitle", () => {
  it("shows nouveau message when unread", () => {
    expect(ticketListSubtitle(ticket, null, 3)).toBe("Nouveau message");
  });

  it("prefixes support messages when read", () => {
    const last: TicketMessage = {
      content: "Le coursier arrive",
      ticketId: 12,
      senderId: 5,
      createdAt: "2026-06-14T12:00:00.000Z",
    };
    expect(ticketListSubtitle({ ...ticket, isMessageRead: true }, last, 3)).toBe("Support : Le coursier arrive");
  });

  it("prefixes user messages when read", () => {
    const last: TicketMessage = {
      content: "Mon colis est abîmé",
      ticketId: 12,
      senderId: 3,
      createdAt: "2026-06-14T12:00:00.000Z",
    };
    expect(ticketListSubtitle({ ...ticket, isMessageRead: true }, last, 3)).toBe("Vous : Mon colis est abîmé");
  });
});

describe("enrichConversationWithTicket", () => {
  const now = new Date("2026-06-14T14:00:00.000Z");

  it("sets unread badge and subtitle from ticket", () => {
    const enriched = enrichConversationWithTicket(baseItem, ticket, null, { currentUserId: 3, now });
    expect(enriched.unreadCount).toBe(1);
    expect(enriched.subtitle).toBe("Nouveau message");
    expect(enriched.isUnread).toBe(true);
  });

  it("uses ticket activity time and meta line", () => {
    const enriched = enrichConversationWithTicket(baseItem, ticket, null, { currentUserId: 3, now });
    expect(enriched.timeLabel).toBe("il y a 2 h");
    expect(enriched.metaLine).toBe("REF: LVS-1 · LIVRAISON");
  });
});

describe("filterConversationsWithTickets", () => {
  it("keeps only items with a ticketId", () => {
    const withTicket = enrichConversationWithTicket(baseItem, ticket, null);
    const withoutTicket = enrichConversationWithTicket({ ...baseItem, id: "2002" }, null, null);
    expect(filterConversationsWithTickets([withTicket, withoutTicket])).toEqual([withTicket]);
  });

  it("drops items with invalid ticketId", () => {
    const invalid = { ...enrichConversationWithTicket(baseItem, ticket, null), ticketId: Number.NaN };
    expect(filterConversationsWithTickets([invalid])).toEqual([]);
  });
});

describe("sortConversationsByActivity", () => {
  it("sorts by lastUpdatedAt descending", () => {
    const a = { ...baseItem, id: "1", lastActivityAt: "2026-06-14T08:00:00.000Z" };
    const b = { ...baseItem, id: "2", lastActivityAt: "2026-06-14T12:00:00.000Z" };
    expect(sortConversationsByActivity([a, b]).map((x) => x.id)).toEqual(["2", "1"]);
  });
});

describe("messageSideForSender", () => {
  it("returns right for current user, left otherwise", () => {
    expect(messageSideForSender(3, 3)).toBe("right");
    expect(messageSideForSender(5, 3)).toBe("left");
  });
});
