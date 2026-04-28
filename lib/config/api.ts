import { Platform } from "react-native";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Base URL for backend API calls.
 *
 * Dev defaults:
 * - iOS simulator: `http://localhost:8085`
 * - Android emulator: `http://10.0.2.2:8085` (maps to host machine)
 *
 * Override via Expo env var:
 * - EXPO_PUBLIC_API_BASE_URL="http://192.168.x.x:8085"
 */
export const API_BASE_URL = stripTrailingSlash(
  (process.env.EXPO_PUBLIC_API_BASE_URL?.trim().length
    ? process.env.EXPO_PUBLIC_API_BASE_URL!.trim()
    : Platform.OS === "android"
      ? "http://10.0.2.2:8085"
      : "http://localhost:8085") as string
);

