import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Pencil, LogOut, HelpCircle, MapPin, User } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { card, row } from "../theme/styles";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { clearVendorToken } from "@/lib/auth/token";

function SettingRow({
  icon,
  iconBg,
  iconColor,
  title,
  titleColor,
  onPress,
  showChevron = true,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  titleColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  const Icon = icon;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        height: 80,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={iconColor} />
      </View>

      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: titleColor ?? colors.text,
          }}
        >
          {title}
        </Text>
      </View>

      {showChevron ? <ChevronRight size={18} color={"rgba(25,28,29,0.25)"} /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "rgba(25,28,29,0.06)" }} />;
}

export default function ProfileScreen() {
  async function onLogout() {
    await clearVendorToken();
    router.replace("/login");
  }

  return (
    <ScreenLayout
      header={
        <View style={{ height: 44, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 44, height: 44, justifyContent: "center" }}
          >
            <ChevronRight
              size={20}
              color={colors.primary}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ ...typography.bodyRegular, fontWeight: "700", color: "#0F172A" }}>
              Profil
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      }
    >
      {/* Profile header */}
      <View style={{ alignItems: "center", marginTop: 8, marginBottom: 22 }}>
        <View style={{ width: 112, height: 112 }}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 40,
              backgroundColor: "#A5A5A5",
              borderWidth: 4,
              borderColor: colors.white,
            }}
          />
          <Pressable
            hitSlop={10}
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 31,
              height: 31,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.12,
              shadowRadius: 15,
              elevation: 4,
            }}
          >
            <Pencil size={14} color={colors.white} />
          </Pressable>
        </View>

        <Text style={{ marginTop: 12, fontSize: 24, fontWeight: "900", color: colors.text }}>
          Julien Santalucia
        </Text>
        <Text style={{ marginTop: 6, fontSize: 16, fontWeight: "600", color: colors.muted, opacity: 0.7 }}>
          +237657799274
        </Text>
      </View>

      {/* Settings groups */}
      <View style={{ gap: 24 }}>
        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            icon={User}
            iconBg={"rgba(58,139,201,0.10)"}
            iconColor={colors.primary}
            title="Mes informations"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            icon={MapPin}
            iconBg={"rgba(58,139,201,0.10)"}
            iconColor={colors.primary}
            title="Adresses enregistrées"
            onPress={() => {}}
          />
        </View>

        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            icon={HelpCircle}
            iconBg={"#F3F4F5"}
            iconColor={"rgba(25,28,29,0.7)"}
            title="Aide"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            icon={LogOut}
            iconBg={"#FEF2F2"}
            iconColor={"#BA1A1A"}
            title="Déconnexion"
            titleColor={"#BA1A1A"}
            onPress={onLogout}
            showChevron
          />
        </View>
      </View>

      <View style={{ marginTop: 22, paddingVertical: 10 }}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: colors.muted,
            opacity: 0.4,
          }}
        >
          Version 2.4.0 • L&apos;Atelier 2024
        </Text>
      </View>
    </ScreenLayout>
  );
}

