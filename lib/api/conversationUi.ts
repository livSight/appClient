import type { ConversationItem } from "@/components/ConversationCard";
import { getTransactionNavigationId, type Transaction } from "@/lib/api/transactions";
import { formatTransactionRef, isExpeditionType } from "@/lib/api/transactionUi";

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
    return {
      id,
      refLabel: `REF: ${ref}`,
      timeLabel,
      type: "expedition",
      title,
      locationLine: `${from} → ${to}`,
      agence: tx.departure?.region?.trim() || "—",
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
  return [item.refLabel, item.title, item.locationLine, item.subtitle, item.agence]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
