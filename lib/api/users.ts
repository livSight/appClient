import { API_BASE_URL } from "@/lib/config/api";
import { logger } from "@/lib/logger";

type ApiError = { success?: false; error?: string; message?: string };

export type User = {
  id?: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export async function getUserById(id: string | number) {
  const safeId = encodeURIComponent(String(id));
  const url = `${API_BASE_URL}/api/users/${safeId}`;
  logger.info("getUser", "GET /api/users/:id", { url, id });

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
    logger.info("getUser", "GET /api/users/:id failed", { status: res.status, body: data ?? rawText });
    const msg =
      (data as ApiError | null)?.message ||
      (data && typeof data === "string" ? data : null) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return (data?.data ?? data) as User;
}

