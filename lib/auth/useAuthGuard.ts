import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth/AuthProvider";

export type AuthGuardInput = {
  pathname: string;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type AuthGuardResult = {
  showSplash: boolean;
  redirectTo: string | null;
};

function isLoginPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/login/");
}

export function resolveAuthGuardRedirect(input: AuthGuardInput): AuthGuardResult {
  const { pathname, isAuthenticated, isLoading } = input;

  if (isLoading) {
    return { showSplash: true, redirectTo: null };
  }

  const onLogin = isLoginPath(pathname);

  if (!isAuthenticated) {
    if (onLogin) {
      return { showSplash: false, redirectTo: null };
    }
    return { showSplash: false, redirectTo: "/login" };
  }

  if (onLogin) {
    return { showSplash: false, redirectTo: "/(tabs)" };
  }

  return { showSplash: false, redirectTo: null };
}

export function useAuthGuard(pathname: string): { showSplash: boolean } {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const { showSplash, redirectTo } = useMemo(
    () =>
      resolveAuthGuardRedirect({
        pathname,
        isAuthenticated,
        isLoading,
      }),
    [isAuthenticated, isLoading, pathname],
  );

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo as Parameters<typeof router.replace>[0]);
    }
  }, [redirectTo, router]);

  return { showSplash };
}
