import { View, Pressable } from "react-native";
import { router } from "expo-router";
import ScreenLayout from "../components/ScreenLayout";
import SolarIcon from "../components/SolarIcon";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";
import { hapticLight } from "@/lib/haptics";
import AppText from "../components/AppText";

function SettingRow({
  iconName,
  iconBg,
  iconColor,
  title,
  titleColor,
  onPress,
  showChevron = true,
}: {
  iconName: string;
  iconBg: string;
  iconColor: string;
  title: string;
  titleColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={async () => {
        await hapticLight();
        onPress?.();
      }}
      disabled={!onPress}
      style={{
        minHeight: 80,
        paddingHorizontal: 20,
        paddingVertical: 16,
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
        <SolarIcon name={iconName} size={24} color={iconColor} />
      </View>

      <View style={{ flex: 1, minWidth: 0, marginLeft: 16 }}>
        <AppText
          style={{
            fontSize: 15,
            fontFamily: fonts.bodyBold,
            color: titleColor ?? colors.text,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </AppText>
      </View>

      {showChevron ? <SolarIcon name="solar:alt-arrow-right-outline" size={24} color={"rgba(25,28,29,0.25)"} /> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "rgba(25,28,29,0.06)" }} />;
}

export default function ProfileScreen() {
  function onLogout() {
    // UI-only: no session to clear.
    router.replace("/(tabs)");
  }

  return (
    <ScreenLayout
      header={
        <View style={{ minHeight: 44, paddingVertical: 8, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 44, height: 44, justifyContent: "center" }}
          >
            <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
            <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: "#0F172A" }} numberOfLines={1}>
              Profil
            </AppText>
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
            <SolarIcon name="solar:pen-outline" size={24} color={colors.white} />
          </Pressable>
        </View>

        <AppText style={{ marginTop: 12, fontSize: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
          Julien Santalucia
        </AppText>
        <AppText variant="dense" style={{ marginTop: 6, fontSize: 16, fontFamily: fonts.bodySemi, color: colors.muted, opacity: 0.7 }} numberOfLines={1} ellipsizeMode="tail">
          +237657799274
        </AppText>
      </View>

      {/* Settings groups */}
      <View style={{ gap: 24 }}>
        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            iconName="solar:user-outline"
            iconBg={"rgba(58,139,201,0.10)"}
            iconColor={colors.primary}
            title="Mes informations"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            iconName="solar:map-point-outline"
            iconBg={"rgba(58,139,201,0.10)"}
            iconColor={colors.primary}
            title="Adresses enregistrées"
            onPress={() => {}}
          />
        </View>

        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            iconName="solar:question-circle-outline"
            iconBg={"#F3F4F5"}
            iconColor={"rgba(25,28,29,0.7)"}
            title="Aide"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            iconName="solar:logout-2-outline"
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
        <AppText
          variant="dense"
          style={{
            textAlign: "center",
            fontSize: 11,
            fontFamily: fonts.bodyBold,
            letterSpacing: 2.2,
            textTransform: "uppercase",
            color: colors.muted,
            opacity: 0.4,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          Version 2.4.0 • L&apos;Atelier 2024
        </AppText>
      </View>
    </ScreenLayout>
  );
}

