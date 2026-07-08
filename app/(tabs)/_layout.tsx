import { Tabs } from "expo-router";
import AppText from "../../components/AppText";
import SolarIcon from "../../components/SolarIcon";
import { useUnreadCount } from "@/lib/unreadCount";
import { featureFlags } from "@/lib/featureFlags";
import { colors, fonts } from "../../theme/tokens";

export default function TabsLayout() {
  const { totalUnread } = useUnreadCount();

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
          title: "Courses",
          tabBarIcon: ({ color, size }) => <SolarIcon name="solar:box-outline" color={color} size={size ?? 24} />,
        }}
      />
      {featureFlags.messagingEnabled ? (
        <Tabs.Screen
          name="inbox"
          options={{
            title: "Inbox",
            tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
            tabBarIcon: ({ color, size }) => <SolarIcon name="solar:chat-round-dots-bold" color={color} size={size ?? 24} />,
          }}
        />
      ) : null}
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

