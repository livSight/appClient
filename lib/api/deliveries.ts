import { API_BASE_URL } from "@/lib/config/api";
import { DEV_USER_ID } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import {
  buildTransactionFormData,
  isTransactionReference,
  parseTransaction,
  type CreateTransactionPayload,
  type ParsedTransaction,
} from "@/lib/api/transactionMapping";

export type Transaction = ParsedTransaction;

type ApiError = { success?: false; error?: string; message?: string };

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

function normalizeListResponse(data: any): any[] {
  if (Array.isArray(data)) return data;
  const inner = data?.data;
  if (Array.isArray(inner)) return inner;
  return [];
}

export async function createTransaction(input: CreateTransactionPayload) {
  const url = `${API_BASE_URL}/api/transactions`;
  const form = buildTransactionFormData(input);

  logger.info("createTransaction", "POST /api/transactions (multipart)", { url, source: input.source, type: input.type });

  const res = await fetch(url, {
    method: "POST",
    headers: { accept: "application/json" },
    body: form,
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("createTransaction", "POST /api/transactions failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return data;
}

export async function listTransactionsForDevUser() {
  const url = `${API_BASE_URL}/api/transactions`;
  logger.info("listTransactions", "GET /api/transactions", { url, user_id: DEV_USER_ID });

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("listTransactions", "GET /api/transactions failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const all = normalizeListResponse(data);
  return all
    .filter((t) => String(t?.user_id ?? "") === String(DEV_USER_ID))
    .map((t) => parseTransaction(t));
}

export async function getTransactionById(id: string | number) {
  const idStr = String(id).trim();
  const url = isTransactionReference(idStr)
    ? `${API_BASE_URL}/api/transactions/reference?transactionReference=${encodeURIComponent(idStr)}`
    : `${API_BASE_URL}/api/transactions/${encodeURIComponent(idStr)}`;

  logger.info("getTransaction", isTransactionReference(idStr) ? "GET /api/transactions/reference" : "GET /api/transactions/:id", {
    url,
    id: idStr,
  });

  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("getTransaction", "GET transaction failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return parseTransaction(data?.data ?? data);
}

export type { CreateTransactionPayload };
