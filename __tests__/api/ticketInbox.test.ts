jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
  },
}));

jest.mock("@/lib/api/transactions", () => ({
  getTransactionById: jest.fn(),
  isTransactionReference: (id: string) => /^LVS-/i.test(id.trim()),
}));

import { apiFetch } from "@/lib/api/client";
import { authSession } from "@/lib/auth/session";
import { fetchTicketInbox, InboxEndpointUnavailableError } from "@/lib/api/tickets";

const mockGetSessionUser = authSession.getSessionUser as jest.Mock;

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  (apiFetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

const sampleInboxItem = {
  ticket: {
    id: 12,
    channel: "client",
    status: "open",
    createdAt: "2026-06-14T10:00:00",
    lastUpdatedAt: "2026-07-04T09:12:00",
    isMessageRead: false,
    assignedAgent: null,
    createdBy: 3,
    transaction: 345,
  },
  transaction: {
    id: 345,
    transactionReference: "LVS-2026-00345",
    clientName: "Marie Dupont",
    driverName: "Jean Martin",
    status: "processing",
    type: "delivery",
    neighborhoodLabel: "Bastos",
    departureLabel: "Centre",
    destinationLabel: "Akwa",
    routeLabel: "Centre → Akwa",
    packageName: "Colis fragile",
    amountDue: 15000,
    clientPhone: "677001122",
    driverPhone: "677003344",
  },
  lastMessage: { id: 9001, senderId: 7, content: "Votre colis est en route.", createdAt: "2026-07-04T09:12:00" },
  messageCount: 14,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSessionUser.mockResolvedValue({ keycloakId: "kc-1" });
});

describe("fetchTicketInbox", () => {
  it("GETs /api/tickets/inbox and parses items", async () => {
    mockApiResponse(200, [sampleInboxItem]);

    const items = await fetchTicketInbox();

    expect(apiFetch).toHaveBeenCalledWith(
      "http://localhost:4040/api/tickets/inbox",
      { method: "GET" },
    );
    expect(items).toHaveLength(1);
    expect(items[0].ticket.id).toBe(12);
    expect(items[0].transaction).toEqual({
      id: 345,
      transactionReference: "LVS-2026-00345",
      clientName: "Marie Dupont",
      driverName: "Jean Martin",
      status: "processing",
      type: "delivery",
      neighborhoodLabel: "Bastos",
      departureLabel: "Centre",
      destinationLabel: "Akwa",
      routeLabel: "Centre → Akwa",
      packageName: "Colis fragile",
      amountDue: 15000,
      clientPhone: "677001122",
      driverPhone: "677003344",
    });
    expect(items[0].lastMessage).toEqual({
      id: 9001,
      content: "Votre colis est en route.",
      ticketId: 12,
      senderId: 7,
      createdAt: "2026-07-04T09:12:00",
    });
    expect(items[0].messageCount).toBe(14);
  });

  it("accepts a null lastMessage", async () => {
    mockApiResponse(200, [{ ...sampleInboxItem, lastMessage: null, messageCount: 0 }]);

    const items = await fetchTicketInbox();

    expect(items[0].lastMessage).toBeNull();
    expect(items[0].messageCount).toBe(0);
  });

  it("tolerates missing optional transaction fields", async () => {
    mockApiResponse(200, [{ ...sampleInboxItem, transaction: { id: 345 } }]);

    const items = await fetchTicketInbox();

    expect(items[0].transaction).toEqual({
      id: 345,
      transactionReference: null,
      clientName: null,
      driverName: null,
      status: null,
      type: null,
      neighborhoodLabel: null,
      departureLabel: null,
      destinationLabel: null,
      routeLabel: null,
      packageName: null,
      amountDue: null,
      clientPhone: null,
      driverPhone: null,
    });
  });

  it("drops rows without a valid ticket or transaction", async () => {
    mockApiResponse(200, [
      sampleInboxItem,
      { ...sampleInboxItem, ticket: null },
      { ...sampleInboxItem, transaction: { id: "not-a-number" } },
    ]);

    const items = await fetchTicketInbox();

    expect(items).toHaveLength(1);
  });

  it("throws InboxEndpointUnavailableError on 404 so callers can fall back", async () => {
    mockApiResponse(404, "Not Found");

    await expect(fetchTicketInbox()).rejects.toBeInstanceOf(InboxEndpointUnavailableError);
  });

  it("throws a regular error on other failures", async () => {
    mockApiResponse(500, { message: "boom" });

    const err = await fetchTicketInbox().catch((e) => e);
    expect(err).not.toBeInstanceOf(InboxEndpointUnavailableError);
    expect(err.message).toBe("boom");
  });
});
