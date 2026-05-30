jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

import { apiFetch } from "@/lib/api/client";
import { getUserById, getUserByKeycloakId, userIdFromUser } from "@/lib/api/users";

const API_BASE = "http://156.67.27.35:8085";

function mockApiResponse(status: number, body: unknown) {
  const rawText = typeof body === "string" ? body : JSON.stringify(body);
  (apiFetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => rawText,
  });
}

describe("userIdFromUser", () => {
  it("parses numeric and string ids", () => {
    expect(userIdFromUser({ id: 3 })).toBe(3);
    expect(userIdFromUser({ id: "7" })).toBe(7);
    expect(userIdFromUser({ id: 0 })).toBeNull();
    expect(userIdFromUser(null)).toBeNull();
  });
});

describe("getUserByKeycloakId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GETs /api/users?keycloakId= via apiFetch and returns first match", async () => {
    mockApiResponse(200, [
      {
        id: 3,
        keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
        email: "snake123@example.com",
      },
    ]);

    const user = await getUserByKeycloakId("5785160a-6c5c-44d5-96fd-d28aa677d8d4");

    expect(apiFetch).toHaveBeenCalledWith(
      `${API_BASE}/api/users?keycloakId=5785160a-6c5c-44d5-96fd-d28aa677d8d4`,
      { method: "GET" },
    );
    expect(user?.id).toBe(3);
    expect(user?.email).toBe("snake123@example.com");
  });

  it("returns null when API returns an empty list", async () => {
    mockApiResponse(200, []);

    await expect(getUserByKeycloakId("missing-id")).resolves.toBeNull();
  });
});

describe("getUserById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GETs /api/users/:id via apiFetch", async () => {
    mockApiResponse(200, { id: 3, first_name: "Maxime" });

    const user = await getUserById(3);

    expect(apiFetch).toHaveBeenCalledWith(`${API_BASE}/api/users/3`, { method: "GET" });
    expect(user.first_name).toBe("Maxime");
  });
});
