import { API_BASE_URL } from "@/lib/config/api";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";

export type StockItem = {
  id?: string | number;
  name: string;
  subtitle?: string;
  qty: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
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

function normalizeListResponse(data: unknown): StockItem[] {
  if (Array.isArray(data)) return data as StockItem[];
  const inner = (data as { data?: unknown } | null)?.data;
  if (Array.isArray(inner)) return inner as StockItem[];
  return [];
}

async function resolveUserId(explicit?: number): Promise<number> {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const userId = await getCurrentUserId();
  if (userId == null) {
    throw new Error("Session utilisateur introuvable");
  }
  return userId;
}

export async function createStockItem(input: Omit<StockItem, "id" | "created_at" | "updated_at"> & { user_id?: number }) {
  const url = `${API_BASE_URL}/api/stock-items`;
  const user_id = await resolveUserId(input.user_id);
  const payload = {
    ...input,
    user_id,
    subtitle: input.subtitle ?? "",
    qty: Math.max(0, Math.floor(Number(input.qty) || 0)),
  };

  logger.info("createStockItem", "POST /api/stock-items", { url, payload });

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("createStockItem", "POST /api/stock-items failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const record = data as { data?: StockItem } | StockItem;
  return ((record as { data?: StockItem }).data ?? record) as StockItem;
}

export async function listStockItems(input?: { user_id?: number }) {
  const userId = await resolveUserId(input?.user_id);
  const url = `${API_BASE_URL}/api/stock-items?user_id=${encodeURIComponent(String(userId))}`;
  logger.info("listStockItems", "GET /api/stock-items", { url, user_id: userId });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("listStockItems", "GET /api/stock-items failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return normalizeListResponse(data);
}

export async function updateStockItemPut(
  id: string | number,
  input: { name: string; subtitle?: string; qty: number; user_id?: number },
) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/stock-items/${safeId}`;
  const user_id = await resolveUserId(input.user_id);
  const payload = {
    ...input,
    user_id,
    subtitle: input.subtitle ?? "",
    qty: Math.max(0, Math.floor(Number(input.qty) || 0)),
  };

  logger.info("updateStockItemPut", "PUT /api/stock-items/:id", { url, id, payload });

  const res = await apiFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("updateStockItemPut", "PUT /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const record = data as { data?: StockItem } | StockItem;
  return ((record as { data?: StockItem }).data ?? record) as StockItem;
}

export async function updateStockItemPatch(id: string | number, input: Partial<Pick<StockItem, "name" | "subtitle" | "qty" | "user_id">>) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/stock-items/${safeId}`;
  const user_id = await resolveUserId(input.user_id);
  const payload = {
    ...input,
    user_id,
    ...(typeof input.qty !== "undefined" ? { qty: Math.max(0, Math.floor(Number(input.qty) || 0)) } : null),
    ...(typeof input.subtitle !== "undefined" ? { subtitle: input.subtitle ?? "" } : null),
  };

  logger.info("updateStockItemPatch", "PATCH /api/stock-items/:id", { url, id, payload });

  const res = await apiFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("updateStockItemPatch", "PATCH /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const record = data as { data?: StockItem } | StockItem;
  return ((record as { data?: StockItem }).data ?? record) as StockItem;
}

export async function deleteStockItem(id: string | number) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/stock-items/${safeId}`;
  logger.info("deleteStockItem", "DELETE /api/stock-items/:id", { url, id });

  const res = await apiFetch(url, { method: "DELETE" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("deleteStockItem", "DELETE /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return data;
}
