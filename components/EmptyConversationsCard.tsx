import { View } from "react-native";
import { router } from "expo-router";
import AppText from "./AppText";
import PillButton from "./PillButton";
import SolarIcon from "./SolarIcon";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";

type Props = {
  query?: string;
};

export default function EmptyConversationsCard({ query = "" }: Props) {
  const isSearching = query.trim().length > 0;

  const title = isSearching ? "Aucun résultat" : "Aucune conversation pour l’instant";
  const subtitle = isSearching
    ? "Essayez avec une autre référence ou un autre mot-clé."
    : "Créez une livraison ou une expédition pour commencer à échanger avec votre coursier.";

  return (
    <View style={[card.base, { padding: 16 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <AppText
          variant="dense"
          style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.55)", letterSpacing: 0.4, textAlign: "center" }}
          numberOfLines={1}
        >
          {isSearching ? "RECHERCHE" : "BIENVENUE"}
        </AppText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
          <SolarIcon name="solar:chat-round-dots-bold" size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <AppText
            style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 20 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </AppText>
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, fontSize: 11, lineHeight: 16, marginTop: 3 }}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {subtitle}
          </AppText>
        </View>
      </View>

      {!isSearching ? (
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            alignSelf: "stretch",
          }}
        >
          <PillButton
            label="Livraison"
            onPress={() => router.push("/ma-demande-livraison")}
            style={{ flex: 1, paddingHorizontal: 12 }}
          />
          <PillButton
            label="Expédition"
            variant="white"
            onPress={() => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } })}
            style={{ flex: 1, paddingHorizontal: 12 }}
          />
        </View>
      ) : null}
    </View>
  );
}
