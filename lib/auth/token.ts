import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "vendor_jwt";

export async function getVendorToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setVendorToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearVendorToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

