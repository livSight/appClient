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
import { getTransactionById } from "@/lib/api/transactions";
import {
  listClientTicketForTransaction,
  listTicketMessages,
  loadClientThread,
  markTicketRead,
  openClientThread,
  replyToTicket,
  resolveNumericTransactionIdFromRoute,
  sendClientMessage,
} from "@/lib/api/tickets";

const KEYCLOAK_ID = "5785160a-6c5c-44d5-96fd-d28aa677d8d4";

const mockGetSessionUser = authSession.getSessionUser as jest.Mock;
const mockGetTransactionById = getTransactionById as jest.Mock;

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  (apiFetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

const sampleTicket = {
  id: 12,
  channel: "client",
  status: "open",
  createdAt: "2026-06-14T10:00:00.000Z",
  lastUpdatedAt: "2026-06-14T11:00:00.000Z",
  isMessageRead: false,
  assignedAgent: 5,
  createdBy: 3,
  transaction: 1001,
};

const sampleMessage = {
  id: 1,
  content: "Bonjour",
  ticketId: 12,
  senderId: 3,
  createdAt: "2026-06-14T10:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSessionUser.mockResolvedValue({ keycloakId: KEYCLOAK_ID });
});

describe("listClientTicketForTransaction", () => {
  it("GETs tickets for transaction with client channel filter", async () => {
    mockApiResponse(200, [sampleTicket]);

    const tickets = await listClientTicketForTransaction(1001);

    expect(apiFetch).toHaveBeenCalledWith(
      "http://localhost:4040/api/tickets/transaction/1001?channel=client",
      { method: "GET" },
    );
    expect(tickets).toHaveLength(1);
    expect(tickets[0].id).toBe(12);
    expect(tickets[0].channel).toBe("client");
  });

  it("returns empty array when no client ticket exists", async () => {
    mockApiResponse(200, []);

    const tickets = await listClientTicketForTransaction(1001);
    expect(tickets).toEqual([]);
  });
});

describe("listTicketMessages", () => {
  it("GETs messages for a ticket", async () => {
    mockApiResponse(200, [sampleMessage]);

    const messages = await listTicketMessages(12);

    expect(apiFetch).toHaveBeenCalledWith(
      "http://localhost:4040/api/tickets/messages?ticketId=12",
      { method: "GET" },
    );
    expect(messages[0].content).toBe("Bonjour");
  });
});

describe("openClientThread", () => {
  it("POSTs /api/messages/new with client channel", async () => {
    mockApiResponse(201, sampleTicket);

    const ticket = await openClientThread(1001, "Premier message");

    expect(apiFetch).toHaveBeenCalledWith("http://localhost:4040/api/messages/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: 1001,
        channel: "client",
        content: "Premier message",
      }),
    });
    expect(ticket.id).toBe(12);
  });
});

describe("replyToTicket", () => {
  it("PUTs /api/messages/{ticketId} with content", async () => {
    mockApiResponse(200, sampleTicket);

    await replyToTicket(12, "Réponse");

    expect(apiFetch).toHaveBeenCalledWith("http://localhost:4040/api/messages/12", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Réponse" }),
    });
  });
});

describe("markTicketRead", () => {
  it("PUTs isMessageRead true", async () => {
    mockApiResponse(200, { ...sampleTicket, isMessageRead: true });

    await markTicketRead(12);

    expect(apiFetch).toHaveBeenCalledWith("http://localhost:4040/api/messages/12", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageRead: true }),
    });
  });

  it("refetches ticket when PUT returns a success message only", async () => {
    mockApiResponse(200, { message: "Message ticket updated successfully" });
    mockApiResponse(200, { ...sampleTicket, isMessageRead: true });

    const ticket = await markTicketRead(12);

    expect(apiFetch).toHaveBeenNthCalledWith(2, "http://localhost:4040/api/tickets/12", { method: "GET" });
    expect(ticket.id).toBe(12);
    expect(ticket.isMessageRead).toBe(true);
  });
});

describe("sendClientMessage", () => {
  it("replies when ticketId is provided", async () => {
    mockApiResponse(200, sampleTicket);

    await sendClientMessage(1001, 12, "Salut");

    expect(apiFetch).toHaveBeenCalledWith("http://localhost:4040/api/messages/12", expect.any(Object));
  });

  it("opens thread when no ticketId", async () => {
    mockApiResponse(201, sampleTicket);

    await sendClientMessage(1001, null, "Premier");

    expect(apiFetch).toHaveBeenCalledWith("http://localhost:4040/api/messages/new", expect.any(Object));
  });

  it("on 409 when opening, fetches existing ticket and replies", async () => {
    mockApiResponse(409, { message: "exists" });
    mockApiResponse(200, [sampleTicket]);
    mockApiResponse(200, sampleTicket);

    await sendClientMessage(1001, null, "Retry");

    expect(apiFetch).toHaveBeenNthCalledWith(2, expect.stringContaining("/api/tickets/transaction/1001"), expect.any(Object));
    expect(apiFetch).toHaveBeenNthCalledWith(3, "http://localhost:4040/api/messages/12", expect.any(Object));
  });
  it("parses ticket id from ticketId when id is absent", async () => {
    mockApiResponse(200, [
      {
        ticketId: 42,
        channel: "client",
        status: "open",
        createdAt: "2026-06-14T10:00:00.000Z",
        lastUpdatedAt: "2026-06-14T11:00:00.000Z",
        isMessageRead: true,
        assignedAgent: 5,
        createdBy: 3,
        transaction: 1001,
      },
    ]);

    const tickets = await listClientTicketForTransaction(1001);

    expect(tickets).toHaveLength(1);
    expect(tickets[0].id).toBe(42);
  });

  it("drops tickets with no parseable id", async () => {
    mockApiResponse(200, [
      {
        channel: "client",
        status: "open",
        createdAt: "2026-06-14T10:00:00.000Z",
        lastUpdatedAt: "2026-06-14T11:00:00.000Z",
        isMessageRead: true,
        assignedAgent: 5,
        createdBy: 3,
        transaction: 1001,
      },
    ]);

    const tickets = await listClientTicketForTransaction(1001);

    expect(tickets).toHaveLength(0);
  });
});

describe("loadClientThread", () => {
  it("marks unread tickets as read when opening the thread", async () => {
    mockApiResponse(200, [{ ...sampleTicket, isMessageRead: false }]);
    mockApiResponse(200, { message: "Message ticket updated successfully" });
    mockApiResponse(200, { ...sampleTicket, isMessageRead: true });
    mockApiResponse(200, [sampleMessage]);

    const thread = await loadClientThread(1001);

    expect(apiFetch).toHaveBeenNthCalledWith(2, "http://localhost:4040/api/messages/12", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageRead: true }),
    });
    expect(thread.ticket?.isMessageRead).toBe(true);
    expect(thread.messages).toHaveLength(1);
  });

  it("marks unread tickets as read in compose-only mode without loading messages", async () => {
    mockApiResponse(200, [{ ...sampleTicket, isMessageRead: false }]);
    mockApiResponse(200, { message: "Message ticket updated successfully" });
    mockApiResponse(200, { ...sampleTicket, isMessageRead: true });

    const thread = await loadClientThread(1001, { composeOnly: true });

    expect(apiFetch).toHaveBeenCalledTimes(3);
    expect(thread).toEqual({ ticket: null, messages: [] });
  });
});

describe("resolveNumericTransactionIdFromRoute", () => {
  it("parses numeric route id", async () => {
    await expect(resolveNumericTransactionIdFromRoute("1001")).resolves.toBe(1001);
  });

  it("resolves LVS reference via getTransactionById", async () => {
    mockGetTransactionById.mockResolvedValueOnce({ id: 42, transactionReference: "LVS-ABC" });

    await expect(resolveNumericTransactionIdFromRoute("LVS-ABC")).resolves.toBe(42);
    expect(mockGetTransactionById).toHaveBeenCalledWith("LVS-ABC");
  });
});
