import { Tabs } from "expo-router";
import { BarChart3, ClipboardList, Home, Package } from "lucide-react-native";
import AppText from "../../components/AppText";
import { colors, fonts } from "../../theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive.commandes,
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="livraison"
        options={{
          title: "Livraison",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rapports"
        options={{
          title: "Rapports",
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: "Stock",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

