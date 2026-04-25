import { logger } from "@/lib/logger";

export const SERVICE_EXPEDITION = "expedition";
export const SERVICE_LIVRAISON = "livraison";

export type ExpeditionClientPayload = {
  clientName: string;
  phone: string;
  address: string;
  notes: string;
};

export function stringifyExpeditionClient(p: ExpeditionClientPayload): string {
  return JSON.stringify(p);
}

export function parseExpeditionClient(raw: string | undefined): ExpeditionClientPayload | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      clientName: typeof o.clientName === "string" ? o.clientName : "",
      phone: typeof o.phone === "string" ? o.phone : "",
      address: typeof o.address === "string" ? o.address : "",
      notes: typeof o.notes === "string" ? o.notes : "",
    };
  } catch {
    logger.info("expeditionClient", "parse failed", { rawLength: raw.length });
    return null;
  }
}

export function isExpeditionService(service: string | undefined): boolean {
  return service === SERVICE_EXPEDITION;
}
