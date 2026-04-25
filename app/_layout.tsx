import { Stack, usePathname } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import "../global.css";
import { usePushNotifications } from "@/lib/push/usePushNotifications";
import { useFonts } from "expo-font";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import {
  Palanquin_600SemiBold,
  Palanquin_700Bold,
} from "@expo-google-fonts/palanquin";

export default function RootLayout() {
  const pathname = usePathname();
  const checking = false;

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Palanquin_600SemiBold,
    Palanquin_700Bold,
  });

  usePushNotifications(pathname, checking);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
