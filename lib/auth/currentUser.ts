import { getUserByKeycloakId, userIdFromUser, type User } from "@/lib/api/users";
import { authSession } from "@/lib/auth/session";

let cachedAppUserId: number | null | undefined;

export function resetCurrentUserIdCache(): void {
  cachedAppUserId = undefined;
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionUser = await authSession.getSessionUser();
  if (!sessionUser?.keycloakId) return null;
  return getUserByKeycloakId(sessionUser.keycloakId);
}

export async function getCurrentUserId(): Promise<number | null> {
  if (cachedAppUserId !== undefined) return cachedAppUserId;

  const user = await getCurrentUser();
  cachedAppUserId = userIdFromUser(user);
  return cachedAppUserId;
}
