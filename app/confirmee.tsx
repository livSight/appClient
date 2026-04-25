import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { X, Check } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "../components/AppText";

export default function ConfirmeeScreen() {
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isExpedition = flow === "expedition";

  return (
    <ScreenLayout>
      {/* Top bar (close + centered title) */}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, marginBottom: 32 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, minHeight: 44, justifyContent: "center" }}>
          <X size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
            {isExpedition ? "Expédition" : "Livraison"}
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 24, paddingBottom: 24 }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: radii.card,
            backgroundColor: "rgba(48,144,192,0.12)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radii.pill,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={28} color={colors.white} />
          </View>
        </View>

        <AppText style={{ ...typography.screenTitle, fontSize: 28, lineHeight: 34 }} numberOfLines={2}>
          Demande envoyée !
        </AppText>
        <AppText style={{ ...typography.subtitle, marginTop: 8 }} numberOfLines={2}>
          {isExpedition ? "Expédition enregistrée" : "Livraison Enregistrée"}
        </AppText>
      </View>

      <View style={{ marginTop: 40, gap: 16 }}>
        <Pressable
          onPress={() => router.replace("/(tabs)/livraison")}
          style={{
            minHeight: 64,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            paddingVertical: 14,
          }}
        >
          <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
            Suivre la commande
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)/livraison")}
          style={{
            minHeight: 64,
            borderRadius: radii.pill,
            backgroundColor: colors.white,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingVertical: 14,
          }}
        >
          <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold }} numberOfLines={2} ellipsizeMode="tail">
            Faire une autre demande
          </AppText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

