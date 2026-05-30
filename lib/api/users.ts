import { API_BASE_URL } from "@/lib/config/api";
import { apiFetch } from "@/lib/api/client";
import { logger } from "@/lib/logger";

type ApiError = { success?: false; error?: string; message?: string };

export type User = {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  email?: string;
  keycloakId?: string;
  city?: string;
  region?: string;
  street?: string;
  roles?: string[];
  dateOfBird?: string;
  gender?: string;
  agency?: unknown;
};

function parseResponseText(rawText: string): unknown {
  if (!rawText.length) return null;
  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function errorMessageFrom(status: number, data: unknown, rawText: string): string {
  if (data && typeof data === "object" && data !== null) {
    const message = (data as ApiError).message;
    if (typeof message === "string" && message.trim().length) return message.trim();
  }
  if (typeof data === "string" && data.trim().length) return data.trim();
  if (rawText.trim().length) return rawText.trim();
  return `HTTP ${status}`;
}

function normalizeUser(data: unknown): User {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
      return record.data as User;
    }
    return record as User;
  }
  return {};
}

function normalizeUserList(data: unknown): User[] {
  if (Array.isArray(data)) return data as User[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: User[] }).data;
  }
  return [];
}

export function userIdFromUser(user: User | null | undefined): number | null {
  const id = user?.id;
  if (typeof id === "number" && Number.isFinite(id) && id > 0) return id;
  if (typeof id === "string" && id.trim()) {
    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export async function getUserByKeycloakId(keycloakId: string): Promise<User | null> {
  const safeKeycloakId = encodeURIComponent(String(keycloakId).trim());
  const url = `${API_BASE_URL}/api/users?keycloakId=${safeKeycloakId}`;
  logger.info("getUser", "GET /api/users?keycloakId", { url, keycloakId });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("getUser", "GET /api/users?keycloakId failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const users = normalizeUserList(data);
  return users[0] ?? null;
}

export async function getUserById(id: string | number) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/users/${safeId}`;
  logger.info("getUser", "GET /api/users/:id", { url, id });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("getUser", "GET /api/users/:id failed", { status: res.status, body: data ?? rawText });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  return normalizeUser(data);
}
