import { authSession } from "@/lib/auth/session";

export type ApiFetchDeps = {
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  fetchFn?: typeof fetch;
};

function buildHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }
  return headers;
}

export function createApiFetch(deps: ApiFetchDeps) {
  const fetchFn = deps.fetchFn ?? fetch;

  return async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = buildHeaders(init);
    const token = await deps.getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetchFn(url, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      await deps.logout();
    }

    return res;
  };
}

export const apiFetch = createApiFetch({
  getAccessToken: () => authSession.getAccessToken(),
  logout: () => authSession.logout("unauthorized"),
});
