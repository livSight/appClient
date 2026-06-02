jest.mock("@/lib/auth/session", () => ({
  authSession: {
    getSessionUser: jest.fn(),
  },
}));

jest.mock("@/lib/api/users", () => ({
  getUserByKeycloakId: jest.fn(),
  userIdFromUser: jest.requireActual("@/lib/api/users").userIdFromUser,
}));

import { authSession } from "@/lib/auth/session";
import { getUserByKeycloakId } from "@/lib/api/users";
import {
  getCurrentUser,
  getCurrentUserId,
  resetCurrentUserIdCache,
} from "@/lib/auth/currentUser";

const mockGetSessionUser = authSession.getSessionUser as jest.Mock;
const mockGetUserByKeycloakId = getUserByKeycloakId as jest.Mock;

describe("getCurrentUserId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCurrentUserIdCache();
  });

  it("returns null when there is no session", async () => {
    mockGetSessionUser.mockResolvedValue(null);

    await expect(getCurrentUserId()).resolves.toBeNull();
    expect(mockGetUserByKeycloakId).not.toHaveBeenCalled();
  });

  it("resolves numeric id from keycloak lookup", async () => {
    mockGetSessionUser.mockResolvedValue({
      keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
    });
    mockGetUserByKeycloakId.mockResolvedValue({ id: 3, email: "snake123@example.com" });

    await expect(getCurrentUserId()).resolves.toBe(3);
    expect(mockGetUserByKeycloakId).toHaveBeenCalledWith("5785160a-6c5c-44d5-96fd-d28aa677d8d4");
  });

  it("caches resolved id until reset", async () => {
    mockGetSessionUser.mockResolvedValue({
      keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
    });
    mockGetUserByKeycloakId.mockResolvedValue({ id: 3 });

    await expect(getCurrentUserId()).resolves.toBe(3);
    await expect(getCurrentUserId()).resolves.toBe(3);

    expect(mockGetUserByKeycloakId).toHaveBeenCalledTimes(1);
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetCurrentUserIdCache();
  });

  it("loads user profile via keycloak id", async () => {
    mockGetSessionUser.mockResolvedValue({
      keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
      email: "snake123@example.com",
    });
    mockGetUserByKeycloakId.mockResolvedValue({
      id: 3,
      first_name: "Maxime",
      email: "snake123@example.com",
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 3,
      first_name: "Maxime",
      email: "snake123@example.com",
    });
  });

  it("deduplicates parallel getCurrentUser calls into one API request", async () => {
    mockGetSessionUser.mockResolvedValue({
      keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
    });
    mockGetUserByKeycloakId.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ id: 3, first_name: "Maxime" }), 10);
        }),
    );

    const [a, b, c] = await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentUser()]);

    expect(a?.id).toBe(3);
    expect(b?.id).toBe(3);
    expect(c?.id).toBe(3);
    expect(mockGetUserByKeycloakId).toHaveBeenCalledTimes(1);
  });

  it("caches getCurrentUser until reset", async () => {
    mockGetSessionUser.mockResolvedValue({
      keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
    });
    mockGetUserByKeycloakId.mockResolvedValue({ id: 3 });

    await getCurrentUser();
    await getCurrentUser();

    expect(mockGetUserByKeycloakId).toHaveBeenCalledTimes(1);
  });
});
