import { createApiFetch } from "@/lib/api/client";

function mockResponse(status: number, body = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as Response;
}

describe("apiFetch", () => {
  let mockFetch: jest.Mock;
  let getAccessToken: jest.Mock;
  let forceRefreshAccessToken: jest.Mock;
  let apiFetch: ReturnType<typeof createApiFetch>;

  beforeEach(() => {
    mockFetch = jest.fn();
    getAccessToken = jest.fn();
    forceRefreshAccessToken = jest.fn(async () => null);
    apiFetch = createApiFetch({
      getAccessToken,
      forceRefreshAccessToken,
      fetchFn: mockFetch,
    });
  });

  it("adds Authorization Bearer header when a token is present", async () => {
    getAccessToken.mockResolvedValue("access-token-abc");
    mockFetch.mockResolvedValue(mockResponse(200, "{}"));

    await apiFetch("http://localhost:4040/api/transactions", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4040/api/transactions",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token-abc");
  });

  it("does not add Authorization when logged out", async () => {
    getAccessToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(mockResponse(200, "{}"));

    await apiFetch("http://localhost:4040/api/transactions");

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("merges accept application/json by default", async () => {
    getAccessToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(mockResponse(200, "{}"));

    await apiFetch("http://localhost:4040/api/transactions");

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("accept")).toBe("application/json");
  });

  it("preserves a custom accept header", async () => {
    getAccessToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(mockResponse(200, "{}"));

    await apiFetch("http://localhost:4040/api/transactions", {
      headers: { accept: "text/plain" },
    });

    const headers = mockFetch.mock.calls[0][1].headers as Headers;
    expect(headers.get("accept")).toBe("text/plain");
  });

  it("refreshes and retries once on 401", async () => {
    getAccessToken.mockResolvedValue("expired-token");
    forceRefreshAccessToken.mockResolvedValue("fresh-token");
    mockFetch
      .mockResolvedValueOnce(mockResponse(401, "Unauthorized"))
      .mockResolvedValueOnce(mockResponse(200, "{}"));

    const res = await apiFetch("http://localhost:4040/api/transactions");

    expect(res.status).toBe(200);
    expect(forceRefreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const retryHeaders = mockFetch.mock.calls[1][1].headers as Headers;
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("returns the original 401 when refresh fails", async () => {
    getAccessToken.mockResolvedValue("expired-token");
    forceRefreshAccessToken.mockResolvedValue(null);
    mockFetch.mockResolvedValue(mockResponse(401, "Unauthorized"));

    const res = await apiFetch("http://localhost:4040/api/transactions");

    expect(res.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry more than once when the retry also gets 401", async () => {
    getAccessToken.mockResolvedValue("expired-token");
    forceRefreshAccessToken.mockResolvedValue("fresh-token");
    mockFetch.mockResolvedValue(mockResponse(401, "Unauthorized"));

    const res = await apiFetch("http://localhost:4040/api/transactions");

    expect(res.status).toBe(401);
    expect(forceRefreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not refresh on non-401 errors", async () => {
    getAccessToken.mockResolvedValue("access-token-abc");
    mockFetch.mockResolvedValue(mockResponse(500, "Server error"));

    const res = await apiFetch("http://localhost:4040/api/transactions");

    expect(res.status).toBe(500);
    expect(forceRefreshAccessToken).not.toHaveBeenCalled();
  });

  it("forwards method and body unchanged", async () => {
    getAccessToken.mockResolvedValue("access-token-abc");
    mockFetch.mockResolvedValue(mockResponse(200, "{}"));
    const body = new FormData();

    await apiFetch("http://localhost:4040/api/transactions", {
      method: "POST",
      body,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4040/api/transactions",
      expect.objectContaining({
        method: "POST",
        body,
      }),
    );
  });
});
