import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { X, Check } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, radii, typography } from "../theme/tokens";

export default function ConfirmeeScreen() {
  return (
    <ScreenLayout>
      {/* Top bar (close + centered title) */}
      <View style={{ flexDirection: "row", alignItems: "center", height: 44, marginBottom: 32 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <X size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Livraison</Text>
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

        <Text style={{ ...typography.screenTitle, fontSize: 28, lineHeight: 34 }}>
          Demande envoyée !
        </Text>
        <Text style={{ ...typography.subtitle, marginTop: 8 }}>Livraison Enregistrée</Text>
      </View>

      <View style={{ marginTop: 40, gap: 16 }}>
        <Pressable
          style={{
            height: 64,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <Text style={typography.buttonTextInverse}>Suivre la commande</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/livraison")}
          style={{
            height: 64,
            borderRadius: radii.pill,
            backgroundColor: colors.white,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ ...typography.bodyRegular, fontWeight: "700" }}>Faire une autre demande</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

