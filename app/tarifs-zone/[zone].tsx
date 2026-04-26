import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AppText from "@/components/AppText";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { card } from "@/theme/styles";
import { colors, fonts, radii, typography } from "@/theme/tokens";

type ZoneDetail = {
  id: string;
  label: string;
  priceXaf: number;
  distanceLabel: string;
  etaLabel: string;
  neighborhoods: string[];
};

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function ZonePill({ children }: { children: string }) {
  return (
    <View style={{ minHeight: 44, borderRadius: radii.pill, backgroundColor: "#F3F4F5", paddingHorizontal: 20, justifyContent: "center" }}>
      <AppText variant="dense" style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1}>
        {children}
      </AppText>
    </View>
  );
}

export default function TarifsZoneDetailScreen() {
  const { zone } = useLocalSearchParams<{ zone?: string }>();

  const detail = useMemo<ZoneDetail>(() => {
    const z = String(zone ?? "1").replace(/[^\d]/g, "") || "1";

    const base: Record<string, ZoneDetail> = {
      "1": {
        id: "1",
        label: "ZONE 1",
        priceXaf: 1000,
        distanceLabel: "0 – 4 km",
        etaLabel: "~30 min moyenne",
        neighborhoods: [
          "Centre-ville",
          "Poste centrale",
          "Etoa-Meki",
          "Nlongkak",
          "Elig-Essono",
          "Bastos",
          "Manguier",
          "Efoulan",
          "Mvog-Ada",
          "Kondengui",
          "Essom",
          "Nkomo",
          "Mfoundi",
          "Ministère",
          "Hotel de ville",
          "Brasserie",
          "Elig-edzoa",
        ],
      },
      "2": {
        id: "2",
        label: "ZONE 2",
        priceXaf: 1500,
        distanceLabel: "4 – 8 km",
        etaLabel: "~45 min moyenne",
        neighborhoods: ["—"],
      },
      "3": {
        id: "3",
        label: "ZONE 3",
        priceXaf: 2000,
        distanceLabel: "8 – 20 km",
        etaLabel: "~1h moyenne",
        neighborhoods: ["—"],
      },
      "4": {
        id: "4",
        label: "ZONE 4",
        priceXaf: 2500,
        distanceLabel: "20 – 30 km",
        etaLabel: "~1h30 moyenne",
        neighborhoods: ["—"],
      },
    };

    return base[z] ?? base["1"];
  }, [zone]);

  const sectorsLabel = useMemo(() => `${detail.neighborhoods.filter((n) => n !== "—").length || 0} SECTEURS`, [detail.neighborhoods]);

  return (
    <ScreenLayout
      header={
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: 8, marginBottom: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center" }}>
            <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText style={{ ...typography.sectionTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={1}>
              Détail de la zone
            </AppText>
          </View>
          <View style={{ width: 44, height: 44 }} />
        </View>
      }
    >
        {/* Bento cards */}
        <View style={{ marginTop: 18, flexDirection: "row", gap: 16 }}>
          <View style={[card.base, { padding: 24, flex: 1, minWidth: 0 }]}>
            <SolarIcon name="solar:map-point-outline" size={20} color={colors.primary} />
            <AppText variant="dense" style={{ marginTop: 10, fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: "#717882", letterSpacing: 0.5 }} numberOfLines={1}>
              IDENTIFIANT
            </AppText>
            <AppText style={{ marginTop: 8, fontSize: 20, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
              {detail.label}
            </AppText>

            <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
              <View style={{ minHeight: 36, borderRadius: radii.pill, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center" }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
                  {formatFcfa(detail.priceXaf)} FCFA
                </AppText>
              </View>
            </View>
          </View>

          <View style={[card.base, { padding: 24, flex: 1, minWidth: 0, backgroundColor: colors.primary }]}>
            <SolarIcon name="solar:routing-bold-duotone" size={20} color={colors.white} />
            <AppText
              variant="dense"
              style={{ marginTop: 10, fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: colors.white, opacity: 0.85, letterSpacing: 0.5 }}
              numberOfLines={2}
            >
              COUVERTURE &{"\n"}TEMPS
            </AppText>

            <AppText style={{ marginTop: 10, fontSize: 24, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1} ellipsizeMode="tail">
              {detail.distanceLabel}
            </AppText>
            <AppText variant="dense" style={{ marginTop: 8, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyMedium, color: colors.white, opacity: 0.9 }} numberOfLines={1}>
              {detail.etaLabel}
            </AppText>
          </View>
        </View>

        {/* Neighborhoods */}
        <View style={{ marginTop: 28 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <AppText style={{ fontSize: 20, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
              Quartiers couverts
            </AppText>
            <View style={{ minHeight: 24, borderRadius: radii.pill, backgroundColor: "rgba(14,165,233,0.10)", paddingHorizontal: 12, paddingVertical: 4, flexShrink: 0 }}>
              <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                {sectorsLabel}
              </AppText>
            </View>
          </View>

          <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {detail.neighborhoods.map((n) => (
              <ZonePill key={n}>{n}</ZonePill>
            ))}
          </View>
        </View>
    </ScreenLayout>
  );
}

