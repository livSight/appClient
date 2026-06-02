import { getUserByKeycloakId, userIdFromUser, type User } from "@/lib/api/users";
import { authSession } from "@/lib/auth/session";

let cachedAppUserId: number | null | undefined;
let cachedUser: User | null | undefined;
let cachedUserKeycloakId: string | undefined;
let inflightUserRequest: Promise<User | null> | null = null;

/** Clears profile cache (call on login, logout, session invalidation). */
export function resetCurrentUserIdCache(): void {
  cachedAppUserId = undefined;
  cachedUser = undefined;
  cachedUserKeycloakId = undefined;
  inflightUserRequest = null;
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionUser = await authSession.getSessionUser();
  if (!sessionUser?.keycloakId) {
    resetCurrentUserIdCache();
    return null;
  }

  const keycloakId = sessionUser.keycloakId.trim();

  if (cachedUserKeycloakId === keycloakId && cachedUser !== undefined) {
    return cachedUser;
  }

  if (inflightUserRequest && cachedUserKeycloakId === keycloakId) {
    return inflightUserRequest;
  }

  cachedUserKeycloakId = keycloakId;
  inflightUserRequest = getUserByKeycloakId(keycloakId)
    .then((user) => {
      cachedUser = user;
      cachedAppUserId = userIdFromUser(user);
      inflightUserRequest = null;
      return user;
    })
    .catch((error) => {
      inflightUserRequest = null;
      cachedUser = undefined;
      cachedAppUserId = undefined;
      throw error;
    });

  return inflightUserRequest;
}

export async function getCurrentUserId(): Promise<number | null> {
  if (cachedAppUserId !== undefined) return cachedAppUserId;

  const user = await getCurrentUser();
  cachedAppUserId = userIdFromUser(user);
  return cachedAppUserId;
}
