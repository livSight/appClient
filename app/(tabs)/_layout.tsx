import { Tabs } from "expo-router";
import AppText from "../../components/AppText";
import SolarIcon from "../../components/SolarIcon";
import { colors, fonts } from "../../theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabel: ({ color, children }) => (
          <AppText
            variant="dense"
            style={{ color, fontSize: 12, letterSpacing: 1.2, fontFamily: fonts.bodyBold }}
            numberOfLines={1}
          >
            {children}
          </AppText>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:home-2-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="livraison"
        options={{
          title: "Livraison",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:box-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:chat-round-dots-bold" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="rapports"
        options={{
          title: "Rapports",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:chart-2-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:widget-5-outline" color={color} size={size ?? 24} />,
        }}
      />
    </Tabs>
  );
}

