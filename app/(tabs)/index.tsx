import { View, Text, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shirt, UtensilsCrossed, Gem, Package2 } from "lucide-react-native";
import { router } from "expo-router";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import CategoryCard from "../../components/CategoryCard";
import OrderCard from "../../components/OrderCard";
import PillButton from "../../components/PillButton";

export default function AccueilScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = width - spacing.screenPaddingX * 2;
  const cardWidth = (contentWidth - spacing.gridColGap) / 2;

  return (
    <ScreenLayout>
      {/* Greeting */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <Text style={typography.screenTitle}>Bonjour Alex</Text>
        <Text style={[typography.subtitle, { marginTop: 8 }]}>
          Que souhaitez-vous vous faire livrer{"\n"}aujourd&apos;hui ?
        </Text>
      </View>

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

        <Text style={typography.label}>Offre de bienvenue</Text>
        <Text style={[typography.bannerTitle, { marginTop: 8 }]}>
          Livraison gratuite sur{"\n"}votre première{"\n"}commande
        </Text>
        <PillButton
          label="En profiter"
          variant="white"
          style={{ marginTop: 16 }}
          onPress={() => router.push("/livraison-zone")}
        />
      </LinearGradient>

      {/* Recent Deliveries */}
      <View>
        <SectionHeader title="Dernière commande" linkLabel="Voir tout" />
        <OrderCard
          title="Chechia Homme"
          subtitle="Mobile Omnisports • Il y a 2 jours"
        />
      </View>
    </ScreenLayout>
  );
}
