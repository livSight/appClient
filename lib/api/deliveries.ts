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

