import type { ConversationItem } from "@/lib/api/conversationUi";
import type { TicketMessage, TicketResponse } from "@/lib/api/tickets";

export type EnrichedConversationItem = ConversationItem & {
  ticketId?: number | null;
  lastActivityAt?: string | null;
  metaLine?: string;
  isUnread?: boolean;
};

export function pickClientTicket(tickets: TicketResponse[]): TicketResponse | null {
  return tickets.find((t) => t.channel === "client") ?? null;
}

export function formatRelativeActivityTime(iso?: string, now = new Date()): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) {
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return `il y a ${diffHours} h`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    yesterday.getFullYear() === date.getFullYear() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getDate() === date.getDate()
  ) {
    return "Hier";
  }

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function conversationMetaLine(item: ConversationItem): string {
  const typeLabel = item.type === "expedition" ? "EXPÉDITION" : "LIVRAISON";
  return `${item.refLabel} · ${typeLabel}`;
}

export function ticketListSubtitle(
  ticket: TicketResponse | null,
  lastMessage: TicketMessage | null,
  currentUserId?: number | null,
): string {
  if (!ticket) return "Ouvrir la conversation";
  if (!ticket.isMessageRead) return "Nouveau message";

  const preview = String(lastMessage?.content ?? "").trim();
  if (!preview.length) return "Ouvrir la conversation";

  const isUserMessage =
    currentUserId != null && lastMessage != null && lastMessage.senderId === currentUserId;
  return `${isUserMessage ? "Vous" : "Support"} : ${preview}`;
}

type EnrichOptions = {
  currentUserId?: number | null;
  now?: Date;
  unreadCount?: number;
};

export function enrichConversationWithTicket(
  item: ConversationItem,
  ticket: TicketResponse | null,
  lastMessage: TicketMessage | null,
  options?: EnrichOptions,
): EnrichedConversationItem {
  const isUnread = Boolean(ticket && !ticket.isMessageRead);
  return {
    ...item,
    ticketId: ticket?.id ?? null,
    metaLine: conversationMetaLine(item),
    isUnread,
    unreadCount: isUnread ? (options?.unreadCount ?? 1) : undefined,
    subtitle: ticket ? ticketListSubtitle(ticket, lastMessage, options?.currentUserId) : item.subtitle,
    timeLabel: ticket ? formatRelativeActivityTime(ticket.lastUpdatedAt, options?.now) : item.timeLabel,
    lastActivityAt: ticket?.lastUpdatedAt ?? null,
  };
}

export function filterConversationsWithTickets(items: EnrichedConversationItem[]): EnrichedConversationItem[] {
  return items.filter(
    (item) => item.ticketId != null && Number.isFinite(item.ticketId) && item.ticketId > 0,
  );
}

export function sortConversationsByActivity(items: EnrichedConversationItem[]): EnrichedConversationItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.lastActivityAt ?? "") || 0;
    const bTime = Date.parse(b.lastActivityAt ?? "") || 0;
    return bTime - aTime;
  });
}

export function messageSideForSender(senderId: number, currentUserId: number | null): "left" | "right" {
  return currentUserId != null && senderId === currentUserId ? "right" : "left";
}

export function formatMessageTime(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatMessageMeta(iso?: string, senderLabel = "Support LivSight"): string {
  const time = formatMessageTime(iso);
  return time ? `${senderLabel} • ${time}` : senderLabel;
}

export function lastMessageFromList(messages: TicketMessage[]): TicketMessage | null {
  if (!messages.length) return null;
  return messages[messages.length - 1] ?? null;
}
