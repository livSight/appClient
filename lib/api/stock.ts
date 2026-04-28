import { API_BASE_URL } from "@/lib/config/api";
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

const DEV_USER_ID = Number(process.env.EXPO_PUBLIC_DEV_USER_ID ?? "1") || 1;

function parseResponseText(rawText: string): any {
  if (!rawText.length) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function errorMessageFrom(resStatus: number, data: any, rawText: string): string {
  return (
    (data as ApiError | null)?.message ||
    (data && typeof data === "string" ? data : null) ||
    (rawText && typeof rawText === "string" ? rawText : null) ||
    `HTTP ${resStatus}`
  );
}

function normalizeListResponse(data: any): StockItem[] {
  if (Array.isArray(data)) return data as StockItem[];
  const inner = data?.data;
  if (Array.isArray(inner)) return inner as StockItem[];
  return [];
}

export async function createStockItem(input: Omit<StockItem, "id" | "created_at" | "updated_at"> & { user_id?: number }) {
  const url = `${API_BASE_URL}/api/stock-items`;
  const payload = {
    ...input,
    user_id: typeof input.user_id === "number" ? input.user_id : DEV_USER_ID,
    subtitle: input.subtitle ?? "",
    qty: Math.max(0, Math.floor(Number(input.qty) || 0)),
  };

  logger.info("createStockItem", "POST /api/stock-items", { url, payload });

  const res = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("createStockItem", "POST /api/stock-items failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return (data?.data ?? data) as StockItem;
}

export async function listStockItems(input?: { user_id?: number }) {
  const userId = typeof input?.user_id === "number" ? input.user_id : DEV_USER_ID;
  const url = `${API_BASE_URL}/api/stock-items?user_id=${encodeURIComponent(String(userId))}`;
  logger.info("listStockItems", "GET /api/stock-items", { url, user_id: userId });

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
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
  const payload = {
    ...input,
    user_id: typeof input.user_id === "number" ? input.user_id : DEV_USER_ID,
    subtitle: input.subtitle ?? "",
    qty: Math.max(0, Math.floor(Number(input.qty) || 0)),
  };

  logger.info("updateStockItemPut", "PUT /api/stock-items/:id", { url, id, payload });

  const res = await fetch(url, {
    method: "PUT",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("updateStockItemPut", "PUT /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return (data?.data ?? data) as StockItem;
}

export async function updateStockItemPatch(id: string | number, input: Partial<Pick<StockItem, "name" | "subtitle" | "qty" | "user_id">>) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/stock-items/${safeId}`;
  const payload = {
    ...input,
    user_id: typeof input.user_id === "number" ? input.user_id : DEV_USER_ID,
    ...(typeof input.qty !== "undefined" ? { qty: Math.max(0, Math.floor(Number(input.qty) || 0)) } : null),
    ...(typeof input.subtitle !== "undefined" ? { subtitle: input.subtitle ?? "" } : null),
  };

  logger.info("updateStockItemPatch", "PATCH /api/stock-items/:id", { url, id, payload });

  const res = await fetch(url, {
    method: "PATCH",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("updateStockItemPatch", "PATCH /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return (data?.data ?? data) as StockItem;
}

export async function deleteStockItem(id: string | number) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/stock-items/${safeId}`;
  logger.info("deleteStockItem", "DELETE /api/stock-items/:id", { url, id });

  const res = await fetch(url, { method: "DELETE", headers: { accept: "application/json" } });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("deleteStockItem", "DELETE /api/stock-items/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return data;
}

