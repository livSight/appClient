import type { TransactionCardItem } from "@/components/TransactionCard";
import { getTransactionNavigationId, type Transaction } from "@/lib/api/transactions";
import { formatTransactionRef, isExpeditionType } from "@/lib/api/transactionUi";

export type ConversationBase = {
  id: string;
  refLabel: string;
  timeLabel: string;
  metaLine?: string;
  title: string;
  locationLine?: string;
  subtitle: string;
  unreadCount?: number;
  isUnread?: boolean;
  amountXaf?: number | null;
};

export type ConversationLivraisonItem = ConversationBase & {
  type: "livraison";
};

export type ConversationExpeditionItem = ConversationBase & {
  type: "expedition";
  agence?: string;
};

export type ConversationItem = ConversationLivraisonItem | ConversationExpeditionItem;

export function mapConversationToTransactionCardItem(item: ConversationItem): TransactionCardItem {
  const ref = item.refLabel.replace(/^REF:\s*/i, "").trim() || item.id;
  const isUnread = Boolean(item.isUnread || item.unreadCount);

  return {
    id: item.id,
    ref,
    title: item.title,
    quartier: item.locationLine?.trim() || "—",
    dateLabel: item.timeLabel,
    status: "En cours",
    statusLabel: isUnread ? `${item.unreadCount ?? 1} NON LU${(item.unreadCount ?? 1) > 1 ? "S" : ""}` : "MESSAGES",
    paymentLabel: item.subtitle,
    serviceLabel: item.type === "expedition" ? "Expédition" : "Livraison",
    isExpedition: item.type === "expedition",
  };
}

function productTitleFromTransaction(tx: Transaction): string {
  const qty = Number.isFinite(Number(tx.quantity)) ? Math.max(1, Math.floor(Number(tx.quantity))) : 1;
  const titleBase = String(tx.package_name ?? "Colis").trim() || "Colis";
  return qty > 1 && !titleBase.includes("x") ? `${titleBase} x${qty}` : titleBase;
}

function quartierFromTransaction(tx: Transaction): string {
  const street =
    typeof tx.destination?.street === "string"
      ? tx.destination.street
      : String(tx.destination_street ?? "").trim();
  const fromStreet = street.split("—")[0]?.trim() || street.trim();
  return fromStreet.length ? fromStreet : "—";
}

function messagePreviewFromTransaction(tx: Transaction, title: string): string {
  const description = String(tx.description ?? "").trim();
  if (description.length && description.toLowerCase() !== title.toLowerCase()) {
    return description;
  }
  return "Ouvrir la conversation";
}

function timeLabelFromIso(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

export function mapTransactionToConversationItem(tx: Transaction): ConversationItem | null {
  const id = getTransactionNavigationId(tx);
  if (!id) return null;

  const ref = formatTransactionRef(tx);
  const title = productTitleFromTransaction(tx);
  const amountXaf = Number.isFinite(Number(tx.amount)) ? Math.max(0, Math.round(Number(tx.amount))) : null;
  const timeLabel = timeLabelFromIso(tx.created_at);
  const subtitle = messagePreviewFromTransaction(tx, title);

  if (isExpeditionType(tx.type)) {
    const from = tx.departure?.city?.trim() || "—";
    const to = tx.destination?.city?.trim() || "—";
    const agence = tx.departure?.region?.trim() || "";
    const trajet = `${from} → ${to}`;
    return {
      id,
      refLabel: `REF: ${ref}`,
      timeLabel,
      type: "expedition",
      title,
      locationLine: agence.length ? `${trajet} · ${agence}` : trajet,
      amountXaf,
      subtitle,
    };
  }

  return {
    id,
    refLabel: `REF: ${ref}`,
    timeLabel,
    type: "livraison",
    title,
    locationLine: quartierFromTransaction(tx),
    amountXaf,
    subtitle,
  };
}

export function conversationSearchText(item: ConversationItem): string {
  return [item.refLabel, item.metaLine, item.title, item.locationLine, item.subtitle, item.agence]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
