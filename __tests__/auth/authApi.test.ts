import { login, AuthError, type AuthTokens } from "@/lib/auth/authApi";

const LOGIN_URL = "http://localhost:4040/auth/login";

function mockFetchJson(status: number, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  });
}

function mockFetchText(status: number, rawText: string) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

describe("login", () => {
  const credentials = { username: "snake123@example.com", password: "Abc123" };

  const sampleResponse: AuthTokens = {
    accessToken: "access-token-abc",
    refreshToken: "refresh-token-xyz",
    expiresIn: 1200,
    tokenType: "Bearer",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POSTs to AUTH_BASE_URL/auth/login with JSON credentials", async () => {
    mockFetchJson(200, sampleResponse);

    await login(credentials);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(LOGIN_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
  });

  it("returns parsed accessToken, refreshToken, expiresIn, and tokenType", async () => {
    mockFetchJson(200, sampleResponse);

    const tokens = await login(credentials);

    expect(tokens).toEqual(sampleResponse);
  });

  it("coerces expiresIn to a number when the API returns a string", async () => {
    mockFetchJson(200, { ...sampleResponse, expiresIn: "1200" });

    const tokens = await login(credentials);

    expect(tokens.expiresIn).toBe(1200);
  });

  it("throws AuthError on 401 with a readable message", async () => {
    mockFetchText(401, "Invalid credentials");

    const err = await login(credentials).catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toMatchObject({
      name: "AuthError",
      message: "Invalid credentials",
      status: 401,
    });
  });

  it("throws AuthError when response JSON has a message field", async () => {
    mockFetchJson(400, { message: "Username is required" });

    await expect(login(credentials)).rejects.toMatchObject({
      name: "AuthError",
      message: "Username is required",
      status: 400,
    });
  });

  it("throws AuthError when required token fields are missing", async () => {
    mockFetchJson(200, { accessToken: "only-access" });

    await expect(login(credentials)).rejects.toMatchObject({
      name: "AuthError",
      message: expect.stringContaining("Invalid login response"),
    });
  });

  it("throws AuthError when fetch fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network request failed"));

    await expect(login(credentials)).rejects.toMatchObject({
      name: "AuthError",
      message: "Network request failed",
    });
  });

  it("uses HTTP status as message when body is empty", async () => {
    mockFetchText(500, "");

    await expect(login(credentials)).rejects.toMatchObject({
      name: "AuthError",
      message: "HTTP 500",
      status: 500,
    });
  });
});
