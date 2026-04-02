import { useEffect, useMemo, useState } from "react";
import { View, Text, useWindowDimensions, ActivityIndicator, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shirt, UtensilsCrossed, Gem, Package2 } from "lucide-react-native";
import { router } from "expo-router";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import CategoryCard from "../../components/CategoryCard";
import OrderCard from "../../components/OrderCard";
import PillButton from "../../components/PillButton";
import { listVendorDeliveries, type VendorDelivery } from "@/lib/api/vendor";

function safeNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function deriveTitle(d: VendorDelivery): string {
  return d.customer_name?.trim()
    ? d.customer_name.trim()
    : d.items?.trim()
      ? d.items.trim()
      : d.phone;
}

function formatShortDate(iso?: string): string {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("fr-FR", { day: "2-digit", month: "short" });
}

export default function AccueilScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = width - spacing.screenPaddingX * 2;
  const cardWidth = (contentWidth - spacing.gridColGap) / 2;

  const [loadingRecent, setLoadingRecent] = useState(true);
  const [errorRecent, setErrorRecent] = useState<string | null>(null);
  const [recent, setRecent] = useState<VendorDelivery | null>(null);

  async function loadRecent() {
    setLoadingRecent(true);
    setErrorRecent(null);
    try {
      const res = await listVendorDeliveries({
        page: 1,
        limit: 1,
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      setRecent(res[0] ?? null);
    } catch (e) {
      setErrorRecent(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  const recentUi = useMemo(() => {
    if (!recent) return null;
    const quartier = recent.quartier?.trim() ? recent.quartier.trim() : "—";
    const when = formatShortDate(recent.created_at);
    const amount = `${safeNumber(recent.amount_due)} XAF`;
    const subtitleParts = [quartier, when, amount].filter(Boolean);
    return {
      title: deriveTitle(recent),
      subtitle: subtitleParts.join(" • "),
      id: String(recent.id),
    };
  }, [recent]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]}>
                Bonjour Alex
              </Text>
              <Text style={[typography.subtitle, { marginTop: 4 }]}>
                Que souhaitez-vous vous faire livrer{"\n"}aujourd&apos;hui ?
              </Text>
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
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.primary }}>A</Text>
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
        <SectionHeader
          title="Dernière commande"
          linkLabel="Voir tout"
          onLinkPress={() => router.push("/(tabs)/livraison")}
        />

        {loadingRecent ? (
          <View style={{ paddingVertical: 10, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : errorRecent ? (
          <View style={{ paddingVertical: 4 }}>
            <Text style={{ color: "#D32F2F", fontWeight: "600", marginBottom: 10 }}>
              {errorRecent}
            </Text>
            <Pressable
              onPress={loadRecent}
              style={{
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                alignSelf: "flex-start",
              }}
            >
              <Text style={typography.buttonTextInverse}>Réessayer</Text>
            </Pressable>
          </View>
        ) : recentUi ? (
          <OrderCard
            title={recentUi.title}
            subtitle={recentUi.subtitle}
            onPress={() => router.push(`/livraison-detail/${recentUi.id}`)}
          />
        ) : (
          <Text style={[typography.bodyRegular, { color: colors.muted }]}>
            Aucune livraison récente
          </Text>
        )}
      </View>
    </ScreenLayout>
  );
}
