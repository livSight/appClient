import { useMemo } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import PillButton from "../../components/PillButton";
import AppText from "../../components/AppText";
import HomeTopBar from "../../components/HomeTopBar";
import LivraisonCard, { type LivraisonOrder } from "../../components/LivraisonCard";
import PromoBanner from "../../components/PromoBanner";
import CategoryGrid, { type CategoryItem } from "../../components/CategoryGrid";
 
const MOCK_RECENT: LivraisonOrder = {
  id: "101",
  title: "Chechia Homme",
  quartier: "Mobile Omnisports",
  dateLabel: "Il y a 2 jours",
  status: "En cours",
  amountLabel: "4 000 FCFA",
};

const CATEGORIES: CategoryItem[] = [
  { title: "Livraison", iconName: "solar:delivery-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Expédition", iconName: "solar:rocket-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } }) },
  { title: "Course", iconName: "solar:routing-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Ramassage", iconName: "solar:hand-shake-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-livraison", params: { mode: "pickup", quartier: "" } }) },
];

export default function AccueilScreen() {
  const recentUi = useMemo(() => MOCK_RECENT, []);
  const hasRecent = Boolean(recentUi?.id);
  const agencyStatus = useMemo<"online" | "offline">(() => "online", []);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 20 }}>
          <HomeTopBar
            locationLabel="Yaoundé, Cameroun"
            agencyStatus={agencyStatus}
            onProfilePress={() => router.push("/profile")}
          />
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Bonjour Alex
          </AppText>
        </View>
      }
    >

      {agencyStatus === "offline" ? (
        <View style={{ marginBottom: spacing.sectionGap, borderRadius: radii.card, backgroundColor: "rgba(211,47,47,0.10)", padding: 16 }}>
          <AppText style={{ ...typography.bodyRegular, fontSize: 14, lineHeight: 20, color: "#7A1B1B" }} numberOfLines={3}>
            Agence hors ligne — la prise en charge peut être plus lente.
          </AppText>
        </View>
      ) : null}

      {/* Category Grid */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <SectionHeader title="De quels services avez-vous besoin aujourd'hui ?" style={{ marginBottom: 16 }} />
        <CategoryGrid items={CATEGORIES} />
      </View>

      {/* Recent Deliveries */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <SectionHeader
          title="Dernière commande"
          linkLabel="Voir tout"
          onLinkPress={() => router.push("/(tabs)/livraison")}
          style={{ marginBottom: 16 }}
        />

        {hasRecent ? (
          <LivraisonCard order={recentUi} />
        ) : (
          <View style={{ borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
            <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
              Aucune commande en cours
            </AppText>
            <AppText style={{ ...typography.subtitle, marginTop: 6 }}>
              Créez votre première livraison en 30 secondes.
            </AppText>
            <View style={{ marginTop: 14, flexDirection: "row", gap: 12, alignItems: "center" }}>
              <PillButton label="Créer une livraison" onPress={() => router.push("/ma-demande-livraison")} />
              <PillButton
                label="Créer une expédition"
                variant="white"
                onPress={() => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } })}
              />
            </View>
          </View>
        )}
      </View>

      {/* Promo Banner */}
      <PromoBanner />
    </ScreenLayout>
  );
}
