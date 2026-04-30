import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "../components/ScreenLayout";
import SolarIcon from "../components/SolarIcon";
import LottieView from "lottie-react-native";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "../components/AppText";

export default function ConfirmeeScreen() {
  const { flow, id } = useLocalSearchParams<{ flow?: string; id?: string }>();
  const isExpedition = flow === "expedition";
  const canOpenDetail = typeof id === "string" && id.trim().length > 0;

  return (
    <ScreenLayout>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, marginBottom: 32 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, minHeight: 44, justifyContent: "center" }}>
          <SolarIcon name="solar:close-circle-bold" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
            {isExpedition ? "Expédition" : "Livraison"}
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 24, paddingBottom: 24 }}>
        <LottieView
          source={require("../assets/lottie/success-check.json")}
          autoPlay
          loop={false}
          style={{ width: 120, height: 120, marginBottom: 28 }}
        />

        <AppText style={{ ...typography.screenTitle, fontSize: 28, lineHeight: 34 }} numberOfLines={2}>
          Demande envoyée !
        </AppText>
        <AppText style={{ ...typography.subtitle, marginTop: 8 }} numberOfLines={2}>
          {isExpedition ? "Expédition enregistrée" : "Livraison enregistrée"}
        </AppText>
      </View>

      <View style={{ marginTop: 40, gap: 16 }}>
        <Pressable
          onPress={() => {
            if (canOpenDetail) {
              router.replace({
                pathname: isExpedition ? "/expedition-detail/[id]" : "/livraison-detail/[id]",
                params: { id: String(id) },
              });
              return;
            }
            router.replace("/(tabs)/livraison");
          }}
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
            Voir le détail
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
            Retour aux livraisons
          </AppText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
