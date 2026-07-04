let lastRegisteredToken: string | null = null;

export function rememberRegisteredPushToken(token: string): void {
  lastRegisteredToken = token;
}

export function getRegisteredPushToken(): string | null {
  return lastRegisteredToken;
}

export function clearRegisteredPushToken(): void {
  lastRegisteredToken = null;
}
