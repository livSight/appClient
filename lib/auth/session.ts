export type AuthFailureReason =
  | "unauthorized"
  | "token_expired"
  | "forbidden"
  | "unknown";

type AuthFailureHandler = (reason: AuthFailureReason) => void | Promise<void>;

let handler: AuthFailureHandler | null = null;

export function setAuthFailureHandler(next: AuthFailureHandler | null) {
  handler = next;
}

export async function notifyAuthFailure(reason: AuthFailureReason) {
  try {
    await handler?.(reason);
  } catch {
    // Intentionally swallow: auth failure handling must never crash requests.
  }
}

