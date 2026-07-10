import { logger } from "@/lib/logger";
import { apiFetch } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/config/api";
import { authSession } from "@/lib/auth/session";
import { getTransactionById, isTransactionReference, type Transaction } from "@/lib/api/transactions";

export type TicketChannel = "client" | "driver";

export type TicketStatus = "pending" | "open" | "inProgress" | "resolved" | "closed";

export type TicketResponse = {
  id: number;
  channel: TicketChannel;
  status: TicketStatus;
  createdAt: string;
  lastUpdatedAt: string;
  isMessageRead: boolean;
  assignedAgent: number | null;
  createdBy: number;
  transaction: number;
};

export type TicketMessage = {
  id?: number;
  content: string;
  ticketId: number;
  senderId: number;
  createdAt: string;
};

type ApiError = { success?: false; error?: string; message?: string };

function parseResponseText(rawText: string): unknown {
  if (!rawText.length) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function errorMessageFrom(resStatus: number, data: unknown, rawText: string): string {
  if (data && typeof data === "object" && data !== null) {
    const message = (data as ApiError).message;
    if (typeof message === "string" && message.trim().length) return message.trim();
  }
  if (typeof data === "string" && data.trim().length) return data.trim();
  if (rawText.trim().length) return rawText.trim();
  return `HTTP ${resStatus}`;
}

function normalizeListResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && data !== null) {
    const inner = (data as { data?: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

function parseNumericId(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractTicketId(record: Record<string, unknown>): number | null {
  return (
    parseNumericId(record.id) ??
    parseNumericId(record.ticketId) ??
    parseNumericId(record.ticket_id)
  );
}

function normalizeTicketChannel(value: unknown): TicketChannel {
  return String(value ?? "").trim().toLowerCase() === "driver" ? "driver" : "client";
}

function parseTicket(data: unknown): TicketResponse | null {
  const record =
    data && typeof data === "object" && data !== null && "data" in (data as object)
      ? (data as { data: unknown }).data
      : data;
  if (!record || typeof record !== "object") return null;

  const r = record as Record<string, unknown>;
  const id = extractTicketId(r);
  if (id == null) {
    logger.warn("parseTicket", "invalid ticket id in API response", { record: r });
    return null;
  }

  const transactionRaw = r.transaction;
  const transaction =
    transactionRaw && typeof transactionRaw === "object" && transactionRaw !== null
      ? parseNumericId((transactionRaw as { id?: unknown }).id)
      : parseNumericId(transactionRaw);

  return {
    id,
    channel: normalizeTicketChannel(r.channel),
    status: String(r.status ?? "open") as TicketStatus,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    lastUpdatedAt: String(r.lastUpdatedAt ?? r.last_updated_at ?? r.createdAt ?? r.created_at ?? ""),
    isMessageRead: Boolean(r.isMessageRead ?? r.is_message_read ?? r.messageRead),
    assignedAgent: parseNumericId(r.assignedAgent ?? r.assigned_agent),
    createdBy: parseNumericId(r.createdBy ?? r.created_by) ?? 0,
    transaction: transaction ?? 0,
  };
}

function assertValidTicketId(ticketId: number, context: string): void {
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    throw new Error(`Identifiant de ticket invalide (${context}).`);
  }
}

function parseMessage(data: unknown): TicketMessage | null {
  const r = data as TicketMessage & { ticket_id?: unknown; sender_id?: unknown; created_at?: unknown };
  const ticketId = parseNumericId(r.ticketId ?? r.ticket_id);
  if (ticketId == null) return null;

  return {
    id: r.id != null ? parseNumericId(r.id) ?? undefined : undefined,
    content: String(r.content ?? ""),
    ticketId,
    senderId: parseNumericId(r.senderId ?? r.sender_id) ?? 0,
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
  };
}

async function requireSessionUser() {
  const sessionUser = await authSession.getSessionUser();
  if (!sessionUser?.keycloakId) {
    throw new Error("Session expirée. Reconnectez-vous.");
  }
  return sessionUser;
}

export function resolveNumericTransactionId(tx: Transaction): number | null {
  if (tx.id == null) return null;
  const n = Number(tx.id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function resolveNumericTransactionIdFromRoute(id: string | number): Promise<number> {
  const idStr = String(id).trim();
  if (!idStr.length) {
    throw new Error("Identifiant de commande manquant.");
  }
  if (isTransactionReference(idStr)) {
    const tx = await getTransactionById(idStr);
    const numericId = resolveNumericTransactionId(tx);
    if (!numericId) {
      throw new Error("Transaction introuvable.");
    }
    return numericId;
  }
  const n = Number(idStr);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Identifiant de commande invalide.");
  }
  return n;
}

export type TicketInboxTransaction = {
  id: number;
  transactionReference: string | null;
  /** Full display name (first + last, or email fallback). */
  clientName: string | null;
  /** Null when no driver is assigned. */
  driverName: string | null;
  /** Delivery order status (pending, processing, completed, …). */
  status: string | null;
  /** delivery | pickup | expedition */
  type: string | null;
  /** Quartier (neighborhood, else destination landmark/street/city). */
  neighborhoodLabel: string | null;
  departureLabel: string | null;
  destinationLabel: string | null;
  /** Pre-formatted `departure → destination` when both exist. */
  routeLabel: string | null;
  packageName: string | null;
  /** Gross amount the customer owes (XAF). */
  amountDue: number | null;
  clientPhone: string | null;
  driverPhone: string | null;
};

export type TicketInboxItem = {
  ticket: TicketResponse;
  transaction: TicketInboxTransaction;
  lastMessage: TicketMessage | null;
  messageCount: number;
};

/** Thrown when the gateway doesn't serve /api/tickets/inbox yet — callers fall back to the legacy fan-out. */
export class InboxEndpointUnavailableError extends Error {
  constructor() {
    super("GET /api/tickets/inbox unavailable");
    this.name = "InboxEndpointUnavailableError";
  }
}

function parseInboxItem(data: unknown): TicketInboxItem | null {
  if (!data || typeof data !== "object") return null;
  const r = data as Record<string, any>;

  const ticket = parseTicket(r.ticket);
  if (!ticket) return null;

  const txId = Number(r.transaction?.id);
  if (!Number.isFinite(txId) || txId <= 0) return null;
  const optionalString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length ? value.trim() : null;
  const tr = r.transaction ?? {};
  const amountRaw = Number(tr.amountDue);
  const transaction: TicketInboxTransaction = {
    id: txId,
    transactionReference: optionalString(tr.transactionReference),
    clientName: optionalString(tr.clientName),
    driverName: optionalString(tr.driverName),
    status: optionalString(tr.status),
    type: optionalString(tr.type),
    neighborhoodLabel: optionalString(tr.neighborhoodLabel),
    departureLabel: optionalString(tr.departureLabel),
    destinationLabel: optionalString(tr.destinationLabel),
    routeLabel: optionalString(tr.routeLabel),
    packageName: optionalString(tr.packageName),
    amountDue: Number.isFinite(amountRaw) ? Math.max(0, Math.round(amountRaw)) : null,
    clientPhone: optionalString(tr.clientPhone),
    driverPhone: optionalString(tr.driverPhone),
  };

  let lastMessage: TicketMessage | null = null;
  const lm = r.lastMessage;
  if (lm && typeof lm === "object" && typeof lm.content === "string" && typeof lm.createdAt === "string") {
    const senderId = Number(lm.senderId);
    if (Number.isFinite(senderId)) {
      lastMessage = {
        id: Number.isFinite(Number(lm.id)) ? Number(lm.id) : undefined,
        content: lm.content,
        ticketId: ticket.id,
        senderId,
        createdAt: lm.createdAt,
      };
    }
  }

  const countRaw = Number(r.messageCount);
  const messageCount = Number.isFinite(countRaw) ? Math.max(0, Math.floor(countRaw)) : 0;

  return {
    ticket,
    transaction,
    lastMessage,
    messageCount,
  };
}

/** One-request Conversations list: tickets + last message + count (docs/inbox-endpoint-proposal.md). */
export async function fetchTicketInbox(): Promise<TicketInboxItem[]> {
  await requireSessionUser();
  const url = `${API_BASE_URL}/api/tickets/inbox`;
  logger.info("fetchTicketInbox", "GET /api/tickets/inbox", { url });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (res.status === 404 || res.status === 405) {
    throw new InboxEndpointUnavailableError();
  }
  if (!res.ok) {
    logger.info("fetchTicketInbox", "GET failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return normalizeListResponse<unknown>(data)
    .map((item) => parseInboxItem(item))
    .filter((item): item is TicketInboxItem => item != null);
}

export async function listTicketsForTransaction(
  transactionId: number,
  channel?: TicketChannel,
): Promise<TicketResponse[]> {
  await requireSessionUser();
  const channelQuery = channel ? `?channel=${encodeURIComponent(channel)}` : "";
  const url = `${API_BASE_URL}/api/tickets/transaction/${encodeURIComponent(String(transactionId))}${channelQuery}`;
  logger.info("listTicketsForTransaction", "GET /api/tickets/transaction/:id", { url, transactionId, channel });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("listTicketsForTransaction", "GET failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return normalizeListResponse<unknown>(data)
    .map((item) => parseTicket(item))
    .filter((ticket): ticket is TicketResponse => ticket != null);
}

export async function listClientTicketForTransaction(transactionId: number): Promise<TicketResponse[]> {
  return listTicketsForTransaction(transactionId, "client");
}

export async function getTicket(ticketId: number): Promise<TicketResponse> {
  await requireSessionUser();
  const url = `${API_BASE_URL}/api/tickets/${encodeURIComponent(String(ticketId))}`;
  logger.info("getTicket", "GET /api/tickets/:id", { url, ticketId });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("getTicket", "GET failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const ticket = parseTicket(data);
  if (!ticket) {
    throw new Error("Ticket introuvable.");
  }
  return ticket;
}

export async function listTicketMessages(ticketId: number): Promise<TicketMessage[]> {
  await requireSessionUser();
  assertValidTicketId(ticketId, "listTicketMessages");
  const url = `${API_BASE_URL}/api/tickets/messages?ticketId=${encodeURIComponent(String(ticketId))}`;
  logger.info("listTicketMessages", "GET /api/tickets/messages", { url, ticketId });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("listTicketMessages", "GET failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return normalizeListResponse<unknown>(data)
    .map((item) => parseMessage(item))
    .filter((message): message is TicketMessage => message != null);
}

export async function openClientThread(transactionId: number, content: string): Promise<TicketResponse> {
  await requireSessionUser();
  const url = `${API_BASE_URL}/api/messages/new`;
  const body = {
    transactionId,
    channel: "client" as const,
    content: content.trim(),
  };
  logger.info("openClientThread", "POST /api/messages/new", { transactionId });

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("openClientThread", "POST failed", { status: res.status, body: data ?? rawText });
    throw Object.assign(new Error(errorMessageFrom(res.status, data, rawText)), { status: res.status });
  }

  const ticket = parseTicket(data);
  if (!ticket) {
    throw new Error("Ticket introuvable.");
  }
  return ticket;
}

async function resolveTicketFromUpdateResponse(ticketId: number, data: unknown): Promise<TicketResponse> {
  const parsed = parseTicket(data);
  if (parsed) return parsed;

  const record = data && typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
  const message = typeof record?.message === "string" ? record.message.trim() : "";
  if (message.length) {
    return getTicket(ticketId);
  }

  throw new Error("Ticket introuvable.");
}

export async function replyToTicket(
  ticketId: number,
  content: string,
  extra?: { isMessageRead?: boolean; ticketStatus?: TicketStatus },
): Promise<TicketResponse> {
  await requireSessionUser();
  assertValidTicketId(ticketId, "replyToTicket");
  const url = `${API_BASE_URL}/api/messages/${encodeURIComponent(String(ticketId))}`;
  const payload: Record<string, unknown> = {};
  const trimmed = content.trim();
  if (trimmed.length) payload.content = trimmed;
  if (extra?.isMessageRead != null) payload.messageRead = extra.isMessageRead;
  if (extra?.ticketStatus) payload.TicketStatus = extra.ticketStatus;

  logger.info("replyToTicket", "PUT /api/messages/:ticketId", { ticketId });

  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("replyToTicket", "PUT failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return resolveTicketFromUpdateResponse(ticketId, data);
}

export async function markTicketRead(ticketId: number): Promise<TicketResponse> {
  return replyToTicket(ticketId, "", { isMessageRead: true });
}

export async function sendClientMessage(
  transactionId: number,
  ticketId: number | null,
  content: string,
): Promise<TicketResponse> {
  const trimmed = content.trim();
  if (!trimmed.length) {
    throw new Error("Le message ne peut pas être vide.");
  }

  if (ticketId != null) {
    return replyToTicket(ticketId, trimmed);
  }

  try {
    return await openClientThread(transactionId, trimmed);
  } catch (e: unknown) {
    const status = e && typeof e === "object" && "status" in e ? Number((e as { status: number }).status) : undefined;
    if (status !== 409) throw e;

    const existing = pickClientTicketFromList(await listClientTicketForTransaction(transactionId));
    if (!existing) {
      throw new Error("Conversation introuvable.");
    }
    return replyToTicket(existing.id, trimmed);
  }
}

function pickClientTicketFromList(tickets: TicketResponse[]): TicketResponse | null {
  return tickets.find((t) => t.channel === "client") ?? null;
}

export type LoadClientThreadOptions = {
  /** Mark unread tickets as read but do not load message history (report compose flow). */
  composeOnly?: boolean;
};

export async function loadClientThread(
  transactionId: number,
  options?: LoadClientThreadOptions,
): Promise<{ ticket: TicketResponse | null; messages: TicketMessage[] }> {
  const tickets = await listClientTicketForTransaction(transactionId);
  const ticket = pickClientTicketFromList(tickets);
  if (!ticket) {
    return { ticket: null, messages: [] };
  }

  let activeTicket = ticket;
  if (!ticket.isMessageRead) {
    try {
      activeTicket = await markTicketRead(ticket.id);
    } catch (error: unknown) {
      logger.warn("loadClientThread", "markTicketRead failed", { ticketId: ticket.id, error });
    }
  }

  if (options?.composeOnly) {
    return { ticket: null, messages: [] };
  }

  const messages = await listTicketMessages(activeTicket.id);
  return { ticket: activeTicket, messages };
}
