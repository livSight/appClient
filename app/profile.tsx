import { Alert, View, Pressable } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import ScreenLayout from "../components/ScreenLayout";
import SolarIcon from "../components/SolarIcon";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";
import { hapticLight } from "@/lib/haptics";
import AppText from "../components/AppText";
import { getUserById, type User } from "@/lib/api/users";
import { DEV_USER_ID } from "@/lib/config/env";

function SettingRow({
  iconName,
  iconColor,
  title,
  titleColor,
  onPress,
  showChevron = true,
}: {
  iconName: string;
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
      <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        <SolarIcon name={iconName} size={26} color={iconColor} />
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
  const [user, setUser] = useState<User | null>(null);

  function onLogout() {
    // UI-only: no session to clear.
    router.replace("/(tabs)");
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getUserById(DEV_USER_ID);
        if (!mounted) return;
        setUser(data);
      } catch {
        if (!mounted) return;
        setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fullName = useMemo(() => {
    const name = String(user?.name ?? "").trim();
    if (name) return name;
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    const both = `${first} ${last}`.trim();
    return both || "—";
  }, [user?.first_name, user?.last_name, user?.name]);

  const phoneLabel = useMemo(() => {
    const raw = String(user?.phone ?? "").trim();
    return raw || "—";
  }, [user?.phone]);

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
          {fullName}
        </AppText>
        <AppText variant="dense" style={{ marginTop: 6, fontSize: 16, fontFamily: fonts.bodySemi, color: colors.muted, opacity: 0.7 }} numberOfLines={1} ellipsizeMode="tail">
          {phoneLabel}
        </AppText>
      </View>

      {/* Settings groups */}
      <View style={{ gap: 24 }}>
        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            iconName="solar:user-outline"
            iconColor={colors.primary}
            title="Mes informations"
            onPress={() => router.push("/mes-informations")}
          />
          <Divider />
          <SettingRow
            iconName="solar:tag-outline"
            iconColor={colors.primary}
            title="Consulter les tarifs"
            onPress={() => router.push("/tarifs")}
          />
        </View>

        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            iconName="solar:question-circle-outline"
            iconColor={"rgba(25,28,29,0.5)"}
            title="Aide"
            onPress={() => {}}
          />
          <Divider />
          <SettingRow
            iconName="solar:logout-2-outline"
            iconColor={"#BA1A1A"}
            title="Déconnexion"
            titleColor={"#BA1A1A"}
            onPress={onLogout}
            showChevron
          />
        </View>

        <View style={[card.base, { paddingVertical: 0, paddingHorizontal: 0 }]}>
          <SettingRow
            iconName="solar:trash-bin-trash-outline"
            iconColor={"#BA1A1A"}
            title="Supprimer le compte"
            titleColor={"#BA1A1A"}
            onPress={() => {
              Alert.alert(
                "Supprimer le compte",
                "Cette action est irréversible. Toutes vos données seront supprimées.",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: () => {} },
                ]
              );
            }}
            showChevron={false}
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
          LivSight v1.0.0 • © 2026 Ericdt17
        </AppText>
      </View>
    </ScreenLayout>
  );
}

