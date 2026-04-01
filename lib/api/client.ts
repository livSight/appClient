import { apiBaseUrl } from "@/lib/config/env";
import { getVendorToken } from "@/lib/auth/token";

export type ApiErrorPayload = {
  success: false;
  error: string;
  message: string;
};

type ApiSuccessPayload<T> = {
  success: true;
  data: T;
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;
  url?: string;
  contentType?: string | null;
  rawBodySnippet?: string;

  constructor(
    message: string,
    status: number,
    opts?: {
      payload?: ApiErrorPayload;
      url?: string;
      contentType?: string | null;
      rawBodySnippet?: string;
    }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = opts?.payload;
    this.url = opts?.url;
    this.contentType = opts?.contentType;
    this.rawBodySnippet = opts?.rawBodySnippet;
  }
}

export async function apiFetch<T>(
  path: `/${string}`,
  init: (RequestInit & { auth?: boolean }) = {}
): Promise<T> {
  const auth = init.auth ?? true;
  const token = auth ? await getVendorToken() : null;

  const url = `${apiBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const contentType = res.headers.get("content-type");
  const text = await res.text();

  let json: unknown = null;
  if (text.length) {
    // Only parse as JSON when it looks like JSON (or content-type says so).
    const looksJson = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");
    const isJsonContentType = contentType?.includes("application/json") ?? false;
    if (looksJson || isJsonContentType) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = null;
      }
    }
  }

  if (!res.ok) {
    const payload = (json && typeof json === "object" ? json : undefined) as
      | ApiErrorPayload
      | undefined;
    const message =
      payload && payload.success === false && typeof payload.message === "string"
        ? payload.message
        : `HTTP ${res.status}`;

    const snippet = text.length ? text.slice(0, 200) : "";
    throw new ApiError(message, res.status, {
      payload,
      url,
      contentType,
      rawBodySnippet: snippet,
    });
  }

  if (json && typeof json === "object" && "success" in json) {
    const payload = json as ApiSuccessPayload<T> | ApiErrorPayload;
    if (payload.success === false) {
      throw new ApiError(payload.message, 200, { payload, url, contentType });
    }
    return payload.data;
  }

  // If the server returned non-JSON on success, return raw text.
  return ((json ?? (text as unknown)) as unknown) as T;
}

