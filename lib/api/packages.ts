import { API_BASE_URL } from "@/lib/config/api";
import { apiFetch } from "@/lib/api/client";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { logger } from "@/lib/logger";

/**
 * Server-side `Packages` entity exposed via /api/packages.
 *
 * NOTE: the backend does NOT currently include `id` in any response (entity
 * has it, but the `PackageResponse` DTO drops it). Until that's fixed we
 * synthesize a stable client-side key via `makeClientId`.
 */
export type Package = {
  package_name: string;
  description: string;
  quantity: number;
  user_id: number;
};

type ApiError = { success?: false; error?: string; message?: string };

const DEFAULT_DESCRIPTION = "Aucune description";

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

function normalizeListResponse(data: unknown): Package[] {
  if (Array.isArray(data)) return data as Package[];
  const inner = (data as { data?: unknown } | null)?.data;
  if (Array.isArray(inner)) return inner as Package[];
  return [];
}

function coerceQuantity(value: unknown): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function normalizeDescription(value: string | undefined): string {
  if (typeof value !== "string") return DEFAULT_DESCRIPTION;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : DEFAULT_DESCRIPTION;
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

/**
 * Synthetic stable id for React keys and cross-screen tracking.
 * Swap to the real numeric id once the backend includes it in responses.
 */
export function makeClientId(p: Pick<Package, "user_id" | "package_name">): string {
  return `${p.user_id}:${p.package_name}`;
}

export async function createPackage(input: {
  package_name: string;
  description?: string;
  quantity: number;
  user_id?: number;
}): Promise<Package> {
  const user_id = await resolveUserId(input.user_id);
  const url = `${API_BASE_URL}/api/packages/create-package`;
  const payload = {
    package_name: input.package_name,
    description: normalizeDescription(input.description),
    quantity: coerceQuantity(input.quantity),
    user_id,
  };

  logger.info("createPackage", "POST /api/packages/create-package", { url, payload });

  const res = await apiFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("createPackage", "POST /api/packages/create-package failed", {
      status: res.status,
      body: data ?? rawText,
    });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const record = data as { data?: Package } | Package;
  return ((record as { data?: Package }).data ?? record) as Package;
}

export async function listPackages(input?: { user_id?: number }): Promise<Package[]> {
  const userId = await resolveUserId(input?.user_id);
  const url = `${API_BASE_URL}/api/packages`;

  logger.info("listPackages", "GET /api/packages", { url, user_id: userId });

  const res = await apiFetch(url, { method: "GET" });
  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    logger.info("listPackages", "GET /api/packages failed", {
      status: res.status,
      body: data ?? rawText,
    });
    throw new Error(errorMessageFrom(res.status, data, rawText));
  }

  const all = normalizeListResponse(data);
  return all.filter((p) => Number(p?.user_id) === userId);
}
