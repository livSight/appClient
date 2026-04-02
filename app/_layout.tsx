import { useEffect, useState } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import { clearVendorToken, getVendorToken } from "@/lib/auth/token";
import { setAuthFailureHandler } from "@/lib/auth/session";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthFailureHandler(async () => {
      await clearVendorToken();
      router.replace("/login");
    });

    return () => setAuthFailureHandler(null);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getVendorToken();
        if (cancelled) return;

        const onLogin = pathname === "/login";
        if (!token && !onLogin) {
          router.replace("/login");
          return;
        }
        if (token && onLogin) {
          router.replace("/(tabs)/livraison");
          return;
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
