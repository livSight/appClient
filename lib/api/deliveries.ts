import { API_BASE_URL } from "@/lib/config/api";
import { logger } from "@/lib/logger";

export type CreateTransactionInput = {
  package_name: string;
  description: string;
  weight: string;
  type: string;
  quantity: number;
  receiver_phone: string;
  user_id: number;
  updatedBy: number;
  driver_id: number;
  agent_id: number;
  status: string;
  transactionReference: string;
  amount: number;
  departure_city: string;
  departure_region: string;
  departure_street: string;
  destination_city: string;
  destination_region: string;
  destination_street: string;
};

type ApiError = { success?: false; error?: string; message?: string };

const DEV_USER_ID = Number(process.env.EXPO_PUBLIC_DEV_USER_ID ?? "1") || 1;

export async function createTransaction(input: Omit<CreateTransactionInput, "user_id" | "updatedBy"> & { user_id?: number; updatedBy?: number }) {
  const url = `${API_BASE_URL}/api/transactions`;
  const payload: CreateTransactionInput = {
    ...input,
    user_id: typeof input.user_id === "number" ? input.user_id : DEV_USER_ID,
    updatedBy: typeof input.updatedBy === "number" ? input.updatedBy : DEV_USER_ID,
  };

  logger.info("createTransaction", "POST /api/transactions", { url, payload });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  let data: any = null;
  if (rawText.length) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!res.ok) {
    logger.info("createTransaction", "POST /api/transactions failed", { status: res.status, body: data ?? rawText });
    const msg =
      (data as ApiError | null)?.message ||
      (data && typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export type Transaction = Partial<CreateTransactionInput> & {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
  transactionReference?: string;
  receiver?: { phone?: string };
  departure?: { city?: string; region?: string; street?: string };
  destination?: { city?: string; region?: string; street?: string };
  description?: string;
  mode?: string;
  express?: boolean;
  collect_cash?: boolean;
};

function normalizeListResponse(data: any): Transaction[] {
  if (Array.isArray(data)) return data as Transaction[];
  const inner = data?.data;
  if (Array.isArray(inner)) return inner as Transaction[];
  return [];
}

export async function listTransactionsForDevUser() {
  const url = `${API_BASE_URL}/api/transactions`;
  logger.info("listTransactions", "GET /api/transactions", { url, user_id: DEV_USER_ID });

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const rawText = await res.text().catch(() => "");
  let data: any = null;
  if (rawText.length) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!res.ok) {
    logger.info("listTransactions", "GET /api/transactions failed", { status: res.status, body: data ?? rawText });
    const msg =
      (data as ApiError | null)?.message ||
      (data && typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const all = normalizeListResponse(data);
  // Backend ignores ?user_id; filter client-side for dev.
  return all.filter((t) => String((t as any).user_id ?? "") === String(DEV_USER_ID));
}

export async function getTransactionById(id: string | number) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/transactions/${safeId}`;
  logger.info("getTransaction", "GET /api/transactions/:id", { url, id });

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const rawText = await res.text().catch(() => "");
  let data: any = null;
  if (rawText.length) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!res.ok) {
    logger.info("getTransaction", "GET /api/transactions/:id failed", { status: res.status, body: data ?? rawText });
    const msg =
      (data as ApiError | null)?.message ||
      (data && typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // API might return {data:{...}} or the object directly
  return (data?.data ?? data) as Transaction;
}

