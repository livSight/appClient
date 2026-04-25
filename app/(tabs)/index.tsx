import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ShoppingBasket, Send, Truck, PackageSearch } from "lucide-react-native";
import { router } from "expo-router";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import CategoryCard from "../../components/CategoryCard";
import PillButton from "../../components/PillButton";
import AppText from "../../components/AppText";
import HomeTopBar from "../../components/HomeTopBar";
import HomeRecentOrderCard from "../../components/HomeRecentOrderCard";
 
type HomeOrderStatus = "En cours" | "Livré" | "Annulé";

const MOCK_RECENT: {
  id: string;
  title: string;
  meta: string;
  status: HomeOrderStatus;
  totalXaf: number;
  collectCashXaf: number;
} = {
  id: "101",
  title: "Chechia Homme",
  meta: "Mobile Omnisports • Il y a 2\njours",
  status: "En cours",
  totalXaf: 4000,
  collectCashXaf: 0,
};

export default function AccueilScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = width - spacing.screenPaddingX * 2;
  const cardWidth = (contentWidth - spacing.gridColGap) / 2;
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
          <AppText style={[typography.subtitle, { marginTop: 10 }]}>
            De quels services avez-vous besoin aujourd’hui ?
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

      {/* Recent Deliveries */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <SectionHeader
          title="Dernière commande"
          linkLabel="Voir tout"
          onLinkPress={() => router.push("/(tabs)/livraison")}
          style={{ marginBottom: 16 }}
        />

        {hasRecent ? (
          <HomeRecentOrderCard
            title={recentUi.title}
            meta={recentUi.meta}
            status={recentUi.status}
            totalXaf={recentUi.totalXaf}
            collectCashXaf={recentUi.collectCashXaf}
            onPress={() => router.push(`/livraison-detail/${recentUi.id}`)}
            onQuickActionPress={() => {}}
          />
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

      {/* Category Grid */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
          <CategoryCard
            title="Livraison"
            subtitle=""
            Icon={Truck}
            width={cardWidth}
            onPress={() => router.push("/ma-demande-livraison")}
          />
          <CategoryCard
            title="Expedition"
            subtitle=""
            Icon={Send}
            width={cardWidth}
            onPress={() => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } })}
          />
        </View>
        <View style={{ height: spacing.gridRowGap }} />
        <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
          <CategoryCard
            title="Course"
            subtitle=""
            Icon={ShoppingBasket}
            width={cardWidth}
            onPress={() => router.push("/ma-demande-livraison")}
          />
          <CategoryCard
            title="Ramassage"
            subtitle=""
            Icon={PackageSearch}
            width={cardWidth}
            onPress={() => router.push({ pathname: "/ma-demande-livraison", params: { mode: "pickup", quartier: "" } })}
          />
        </View>
      </View>

      {/* Promo Banner */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radii.card,
          paddingHorizontal: 32,
          paddingTop: 40,
          paddingBottom: 32,
          overflow: "hidden",
          marginBottom: spacing.sectionGap,
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            right: -20,
            bottom: -20,
            width: 160,
            height: 160,
            borderRadius: radii.pill,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 0,
            top: -12,
            width: 96,
            height: 96,
            borderRadius: radii.pill,
            backgroundColor: "rgba(48,144,192,0.85)",
          }}
        />

        <AppText variant="dense" style={typography.label} numberOfLines={1}>
          Offre de bienvenue
        </AppText>
        <AppText style={[typography.bannerTitle, { marginTop: 8 }]}>
          Livraison gratuite sur{"\n"}votre première{"\n"}commande
        </AppText>
        <PillButton
          label="En profiter"
          variant="white"
          style={{ marginTop: 16 }}
          onPress={() => router.push("/ma-demande-livraison")}
        />
      </LinearGradient>
    </ScreenLayout>
  );
}
