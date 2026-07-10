jest.mock("@/lib/api/client", () => ({
  apiFetch: jest.fn(),
}));

jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
  },
}));

import { apiFetch } from "@/lib/api/client";
import { authSession } from "@/lib/auth/session";
import {
  findUserByKeycloakId,
  getUserById,
  getUserByKeycloakId,
  updateCurrentUser,
  userIdFromUser,
} from "@/lib/api/users";

const API_BASE = "http://localhost:4040";

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

describe("findUserByKeycloakId", () => {
  it("matches keycloakId in a multi-user list (not users[0])", () => {
    const users = [
      { id: 5, keycloakId: "2ab7eed1-180a-473c-ba31-c94cd5d2da8d", email: "other@example.com" },
      { id: 6, keycloakId: "6b415ee2-7024-4cbf-9e3b-fa4a5a2054a2", email: "ericdjou17@gmail.com" },
    ];

    const match = findUserByKeycloakId(users, "6b415ee2-7024-4cbf-9e3b-fa4a5a2054a2");

    expect(match?.id).toBe(6);
    expect(match?.email).toBe("ericdjou17@gmail.com");
  });

  it("returns null when no user matches", () => {
    expect(findUserByKeycloakId([{ id: 5, keycloakId: "abc" }], "missing")).toBeNull();
  });
});

describe("getUserByKeycloakId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GETs /api/users?keycloakId= and returns the matching user", async () => {
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

  it("picks the correct user when API returns the full user list", async () => {
    mockApiResponse(200, [
      { id: 5, keycloakId: "2ab7eed1-180a-473c-ba31-c94cd5d2da8d", email: "other@example.com" },
      { id: 6, keycloakId: "6b415ee2-7024-4cbf-9e3b-fa4a5a2054a2", email: "ericdjou17@gmail.com" },
    ]);

    const user = await getUserByKeycloakId("6b415ee2-7024-4cbf-9e3b-fa4a5a2054a2");

    expect(user?.id).toBe(6);
    expect(user?.email).toBe("ericdjou17@gmail.com");
  });

  it("returns null when API returns an empty list", async () => {
    mockApiResponse(200, []);

    await expect(getUserByKeycloakId("missing-id")).resolves.toBeNull();
  });

  it("returns null when keycloakId is not in the list", async () => {
    mockApiResponse(200, [{ id: 5, keycloakId: "other-id", email: "other@example.com" }]);

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

describe("updateCurrentUser", () => {
  const KEYCLOAK_ID = "5785160a-6c5c-44d5-96fd-d28aa677d8d4";

  beforeEach(() => {
    jest.clearAllMocks();
    (authSession.getSessionUser as jest.Mock).mockResolvedValue({ keycloakId: KEYCLOAK_ID });
  });

  it("PUTs /api/users/:keycloakId with X-User-Id and the JSON payload", async () => {
    mockApiResponse(200, { id: 3, keycloakId: KEYCLOAK_ID, first_name: "Snake", city: "Yaoundé" });

    const input = {
      first_name: "Snake",
      last_name: "User",
      email: "snake123@example.com",
      phone: "0745695140",
      dateOfBird: "1990-01-15",
      city: "Yaoundé",
      region: "Centre",
      street: "Bastos",
    };

    const user = await updateCurrentUser(input);

    expect(apiFetch).toHaveBeenCalledWith(`${API_BASE}/api/users/${KEYCLOAK_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": KEYCLOAK_ID,
      },
      body: JSON.stringify(input),
    });
    expect(user.first_name).toBe("Snake");
    expect(user.city).toBe("Yaoundé");
  });

  it("unwraps a { data: user } response envelope", async () => {
    mockApiResponse(200, { data: { id: 3, first_name: "Snake" } });

    const user = await updateCurrentUser({ first_name: "Snake" });

    expect(user.first_name).toBe("Snake");
  });

  it("throws with the API message when the update fails", async () => {
    mockApiResponse(403, { message: "Forbidden: cannot update another user" });

    await expect(updateCurrentUser({ first_name: "X" })).rejects.toThrow(
      "Forbidden: cannot update another user",
    );
  });

  it("throws when there is no session user", async () => {
    (authSession.getSessionUser as jest.Mock).mockResolvedValue(null);

    await expect(updateCurrentUser({ first_name: "X" })).rejects.toThrow("Session expirée");
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
