import { getTransactionById, getTransactionNavigationId } from "@/lib/api/transactions";
import { isExpeditionType } from "@/lib/api/transactionUi";
import { logger } from "@/lib/logger";

export async function resolveTransactionDetailPath(transactionId: string): Promise<string> {
  try {
    const tx = await getTransactionById(transactionId);
    const navId = getTransactionNavigationId(tx) || transactionId;
    if (isExpeditionType(tx.type)) {
      return `/expedition-detail/${navId}`;
    }
    return `/livraison-detail/${navId}`;
  } catch (error: unknown) {
    logger.warn("resolveTransactionDetailPath", "fallback to livraison detail", {
      transactionId,
      error,
    });
    return `/livraison-detail/${transactionId}`;
  }
}
