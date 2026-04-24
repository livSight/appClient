import { useMemo } from "react";
import { View, useWindowDimensions, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shirt, UtensilsCrossed, Gem, Package2 } from "lucide-react-native";
import { router } from "expo-router";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import CategoryCard from "../../components/CategoryCard";
import OrderCard from "../../components/OrderCard";
import PillButton from "../../components/PillButton";
import AppText from "../../components/AppText";
 
const MOCK_RECENT = {
  id: "101",
  title: "Panier de légumes bio",
  subtitle: "Emombo • Aujourd'hui • 4 000 XAF",
};

export default function AccueilScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = width - spacing.screenPaddingX * 2;
  const cardWidth = (contentWidth - spacing.gridColGap) / 2;
  const recentUi = useMemo(() => MOCK_RECENT, []);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
                Bonjour Alex
              </AppText>
              <AppText style={[typography.subtitle, { marginTop: 4 }]}>
                Que souhaitez-vous vous faire livrer{"\n"}aujourd&apos;hui ?
              </AppText>
            </View>

            <Pressable
              hitSlop={10}
              onPress={() => router.push("/profile")}
              style={{
                width: 56,
                height: 56,
                borderRadius: 9999,
                backgroundColor: colors.iconBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText variant="dense" style={{ fontSize: 18, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                A
              </AppText>
            </Pressable>
          </View>
        </View>
      }
    >

      {/* Category Grid */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
          <CategoryCard
            title="Nourriture"
            subtitle="Restaurants"
            Icon={UtensilsCrossed}
            width={cardWidth}
            onPress={() => router.push("/livraison-zone")}
          />
          <CategoryCard
            title="Vêtements"
            subtitle="Mode & Style"
            Icon={Shirt}
            width={cardWidth}
            onPress={() => router.push("/livraison-zone")}
          />
        </View>
        <View style={{ height: spacing.gridRowGap }} />
        <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
          <CategoryCard
            title="Accessoires"
            subtitle="Maison"
            Icon={Gem}
            selected
            width={cardWidth}
            onPress={() => router.push("/livraison-zone")}
          />
          <CategoryCard
            title="Colis divers"
            subtitle="Autres"
            Icon={Package2}
            width={cardWidth}
            onPress={() => router.push("/livraison-zone")}
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
          onPress={() => router.push("/livraison-zone")}
        />
      </LinearGradient>

      {/* Recent Deliveries */}
      <View>
        <SectionHeader
          title="Dernière commande"
          linkLabel="Voir tout"
          onLinkPress={() => router.push("/(tabs)/livraison")}
        />

        <OrderCard
          title={recentUi.title}
          subtitle={recentUi.subtitle}
          onPress={() => router.push(`/livraison-detail/${recentUi.id}`)}
        />
      </View>
    </ScreenLayout>
  );
}
