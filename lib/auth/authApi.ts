import { AUTH_BASE_URL } from "@/lib/config/auth";
import { logger } from "@/lib/logger";

export type LoginCredentials = {
  username: string;
  password: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

export class AuthError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

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
    const message = (data as { message?: string }).message;
    if (typeof message === "string" && message.trim().length) return message.trim();
  }
  if (typeof data === "string" && data.trim().length) return data.trim();
  if (rawText.trim().length) return rawText.trim();
  return `HTTP ${status}`;
}

function parseAuthTokens(data: unknown): AuthTokens {
  if (!data || typeof data !== "object") {
    throw new AuthError("Invalid login response");
  }

  const record = data as Record<string, unknown>;
  const accessToken = typeof record.accessToken === "string" ? record.accessToken.trim() : "";
  const refreshToken = typeof record.refreshToken === "string" ? record.refreshToken.trim() : "";
  const tokenType = typeof record.tokenType === "string" ? record.tokenType.trim() : "";
  const expiresRaw = record.expiresIn;
  const expiresIn =
    typeof expiresRaw === "number"
      ? expiresRaw
      : typeof expiresRaw === "string" && expiresRaw.trim().length
        ? Number(expiresRaw)
        : NaN;

  if (!accessToken || !refreshToken || !tokenType || !Number.isFinite(expiresIn)) {
    throw new AuthError("Invalid login response: missing token fields");
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType,
  };
}

export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  const url = `${AUTH_BASE_URL}/auth/login`;

  logger.info("authApi", "POST /auth/login", { url, username: credentials.username });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e ?? "Network error");
    logger.info("authApi", "POST /auth/login network error", { message });
    throw new AuthError(message);
  }

  const rawText = await res.text().catch(() => "");
  const data = parseResponseText(rawText);

  if (!res.ok) {
    const message = errorMessageFrom(res.status, data, rawText);
    logger.info("authApi", "POST /auth/login failed", { status: res.status, message });
    throw new AuthError(message, res.status);
  }

  return parseAuthTokens(data);
}

/** Refresh flow — add when backend refresh endpoint is confirmed (see docs/auth-tdd-phases.md). */
