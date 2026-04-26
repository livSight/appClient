import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import AppText from "@/components/AppText";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { card } from "@/theme/styles";
import { colors, fonts, radii, typography } from "@/theme/tokens";

type Zone = {
  zoneLabel: string;
  priceXaf: number;
  distanceLabel: string;
  etaLabel: string;
};

type OtherTariff = {
  title: string;
  description: string;
  valueLabel: string;
  valueKind: "pillGreen" | "rightAmount" | "pillMuted" | "rightAmountPrimary";
};

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function ZoneCard({ zone, onPress }: { zone: Zone; onPress?: () => void }) {
  return (
    <View style={[card.base, { padding: 16 }]}>
      <View
        style={{
          minHeight: 22,
          borderRadius: radii.pill,
          backgroundColor: "rgba(14,165,233,0.10)",
          paddingHorizontal: 10,
          paddingVertical: 3,
          alignSelf: "flex-start",
        }}
      >
        <AppText variant="dense" style={{ fontSize: 10, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 1 }} numberOfLines={1}>
          {zone.zoneLabel}
        </AppText>
      </View>

      <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <AppText style={{ fontSize: 22, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
          {formatFcfa(zone.priceXaf)} FCFA
        </AppText>
        <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 13, lineHeight: 18 }} numberOfLines={1}>
          {zone.distanceLabel}
        </AppText>
      </View>

      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(192,199,210,0.10)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 28,
        }}
      >
        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.3 }} numberOfLines={1}>
          VOIR QUARTIERS
        </AppText>
        <SolarIcon name="solar:alt-arrow-right-outline" size={18} color={"rgba(60,74,60,0.55)"} />
      </Pressable>
    </View>
  );
}

function OtherTariffCard({ item }: { item: OtherTariff }) {
  const valueNode = (() => {
    if (item.valueKind === "pillGreen") {
      return (
        <View
          style={{
            minHeight: 36,
            borderRadius: radii.pill,
            backgroundColor: "#DCFCE7",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: "#15803D" }} numberOfLines={1}>
            {item.valueLabel}
          </AppText>
        </View>
      );
    }

    if (item.valueKind === "pillMuted") {
      return (
        <View
          style={{
            minHeight: 28,
            borderRadius: 6,
            backgroundColor: "#ECEEF4",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <AppText variant="dense" style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1}>
            {item.valueLabel}
          </AppText>
        </View>
      );
    }

    const fg = item.valueKind === "rightAmountPrimary" ? colors.primary : colors.text;
    return (
      <AppText style={{ fontSize: 18, lineHeight: 28, fontFamily: fonts.bodyBold, color: fg }} numberOfLines={1} ellipsizeMode="tail">
        {item.valueLabel}
      </AppText>
    );
  })();

  return (
    <View style={[card.base, { padding: 20 }]}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </AppText>
          <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }} numberOfLines={3} ellipsizeMode="tail">
            {item.description}
          </AppText>
        </View>
        <View style={{ flexShrink: 0, alignItems: "flex-end" }}>{valueNode}</View>
      </View>
    </View>
  );
}

export default function TarifsScreen() {
  const zones = useMemo<Zone[]>(
    () => [
      { zoneLabel: "ZONE 1", priceXaf: 1000, distanceLabel: "0 – 4 km", etaLabel: "~30 min" },
      { zoneLabel: "ZONE 2", priceXaf: 1500, distanceLabel: "4 – 8 km", etaLabel: "~45 min" },
      { zoneLabel: "ZONE 3", priceXaf: 2000, distanceLabel: "8 – 20km", etaLabel: "~1h" },
      { zoneLabel: "ZONE 4", priceXaf: 2500, distanceLabel: "20 – 30km", etaLabel: "~1h30" },
    ],
    [],
  );

  const otherTariffs = useMemo<OtherTariff[]>(
    () => [
      {
        title: "Stockage",
        description: "Salle de stockage à l'Hippodrome · Déduction automatique à chaque livraison confirmée",
        valueLabel: "GRATUIT",
        valueKind: "pillGreen",
      },
      {
        title: "Ramassage hors stock",
        description: "Facturé uniquement si le colis n'est pas stocké chez LivSight",
        valueLabel: "500 FCFA",
        valueKind: "rightAmount",
      },
      {
        title: "Retrait / récupération",
        description: "Selon la zone et le type de colis · Tarif fixé à la commande",
        valueLabel: "1 000 – 3 000 FCFA",
        valueKind: "rightAmount",
      },
      {
        title: "Expédition inter-urbaine",
        description: "Commission LivSight · Frais de transit fixés par l'agence de voyage partenaire",
        valueLabel: "1 000 – 3 000 FCFA",
        valueKind: "rightAmount",
      },
      {
        title: "Frais de quartier",
        description: "Ajoutés si le livreur entre dans un quartier spécifique hors tarif de zone",
        valueLabel: "+500 FCFA",
        valueKind: "rightAmountPrimary",
      },
      {
        title: "Courses particuliers",
        description: "Ouvert à tous · Particuliers et commerçants · Commande via l'application",
        valueLabel: "Tarif de zone",
        valueKind: "pillMuted",
      },
    ],
    [],
  );

  return (
    <ScreenLayout
      header={
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: 8, marginBottom: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
            <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText style={{ ...typography.sectionTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={1}>
              Nos Tarifs
            </AppText>
          </View>
          <View style={{ width: 44, height: 44 }} />
        </View>
      }
    >
      {/* Subtitle */}
      <View style={{ marginBottom: 18 }}>
        <AppText style={{ ...typography.subtitle }} numberOfLines={2} ellipsizeMode="tail">
          Répartition par zones géographiques.
        </AppText>
      </View>

      {/* City + Express */}
      <View style={{ marginTop: 18, gap: 16 }}>
        <View style={[card.base, { padding: 24, overflow: "hidden" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="dense" style={{ fontSize: 12, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 1.6 }} numberOfLines={1}>
                VILLE ACTIVE
              </AppText>
              <AppText style={{ fontSize: 30, lineHeight: 36, fontFamily: fonts.bodyBold, color: colors.text, marginTop: 8 }} numberOfLines={1} ellipsizeMode="tail">
                Yaoundé, CM
              </AppText>
            </View>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.02)", alignItems: "center", justifyContent: "center" }}>
              <SolarIcon name="solar:chart-2-outline" size={28} color={"rgba(60,74,60,0.35)"} />
            </View>
          </View>
        </View>

        <View style={[card.base, { backgroundColor: colors.primary, padding: 16 }]}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <AppText variant="dense" style={{ fontSize: 12, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.white, opacity: 0.9, letterSpacing: 1.4 }} numberOfLines={1}>
              LIVRAISON EXPRESS
            </AppText>
            <AppText style={{ marginTop: 4, fontSize: 20, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
              +{formatFcfa(1000)} FCFA
            </AppText>
            <AppText variant="dense" style={{ marginTop: 2, fontSize: 10, lineHeight: 14, fontFamily: fonts.bodyBold, color: colors.white, opacity: 0.8 }} numberOfLines={1}>
              SUR LA ZONE
            </AppText>
          </View>
        </View>
      </View>

      {/* Pricing grid */}
      <View style={{ marginTop: 24, gap: 24 }}>
        {zones.map((z) => (
          <ZoneCard
            key={z.zoneLabel}
            zone={z}
            onPress={() => {
              const id = z.zoneLabel.replace(/[^\d]/g, "") || "1";
              router.push(`/tarifs-zone/${id}`);
            }}
          />
        ))}
      </View>

      {/* Autres Tarifications */}
      <View style={{ marginTop: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <SolarIcon name="solar:hashtag-outline" size={22} color={colors.primary} />
          <AppText style={{ fontSize: 24, lineHeight: 32, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            Autres Tarifications
          </AppText>
        </View>

        <View style={{ gap: 16 }}>
          {otherTariffs.map((it) => (
            <OtherTariffCard key={it.title} item={it} />
          ))}
        </View>
      </View>

      {/* Information card */}
      <View style={{ marginTop: 24 }}>
        <View style={[card.base, { padding: 24 }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
              Information sur la tarification
            </AppText>
            <AppText style={{ ...typography.subtitle, fontSize: 14, lineHeight: 22.75, marginTop: 6 }} numberOfLines={6} ellipsizeMode="tail">
              Les tarifs affichés sont basés sur une livraison standard. Des frais supplémentaires peuvent s&apos;appliquer.
            </AppText>
          </View>
        </View>
      </View>
    </ScreenLayout>
  );
}
