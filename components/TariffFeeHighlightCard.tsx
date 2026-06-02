import { View } from "react-native";
import AppText from "@/components/AppText";
import SolarIcon from "@/components/SolarIcon";
import { formatSupplementFcfaLabel } from "@/lib/api/tariffUi";
import { card } from "@/theme/styles";
import { colors, fonts } from "@/theme/tokens";

type Variant = "express" | "pickup";

type Props = {
  variant: Variant;
  feeXaf: number | null;
  subtitle?: string;
};

const COPY: Record<Variant, { title: string; defaultSubtitle: string; icon: string; iconColor: string }> = {
  express: {
    title: "LIVRAISON EXPRESS",
    defaultSubtitle: "SUR LA ZONE",
    icon: "solar:lightning-bold-duotone",
    iconColor: colors.white,
  },
  pickup: {
    title: "RAMASSAGE HORS STOCK",
    defaultSubtitle: "SI LE COLIS N'EST PAS EN STOCK",
    icon: "solar:hand-shake-bold",
    iconColor: "#B45309",
  },
};

export default function TariffFeeHighlightCard({ variant, feeXaf, subtitle }: Props) {
  const meta = COPY[variant];
  const isExpress = variant === "express";
  const priceLabel = formatSupplementFcfaLabel(feeXaf);

  if (isExpress) {
    return (
      <View style={[card.base, { backgroundColor: colors.primary, padding: 16 }]}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <SolarIcon name={meta.icon} size={24} color={meta.iconColor} />
          <AppText
            variant="dense"
            style={{ marginTop: 8, fontSize: 12, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.white, opacity: 0.9, letterSpacing: 1.4 }}
            numberOfLines={1}
          >
            {meta.title}
          </AppText>
          <AppText style={{ marginTop: 4, fontSize: 20, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
            {priceLabel}
          </AppText>
          <AppText
            variant="dense"
            style={{ marginTop: 2, fontSize: 10, lineHeight: 14, fontFamily: fonts.bodyBold, color: colors.white, opacity: 0.8 }}
            numberOfLines={1}
          >
            {subtitle ?? meta.defaultSubtitle}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={[card.base, { padding: 16, backgroundColor: "rgba(180,83,9,0.08)" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <SolarIcon name={meta.icon} size={28} color={meta.iconColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="dense" style={{ fontSize: 12, lineHeight: 18, fontFamily: fonts.bodyBold, color: "#B45309", letterSpacing: 1.2 }} numberOfLines={2}>
            {meta.title}
          </AppText>
          <AppText variant="dense" style={{ marginTop: 2, fontSize: 10, lineHeight: 14, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
            {subtitle ?? meta.defaultSubtitle}
          </AppText>
        </View>
        <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: "#B45309", flexShrink: 0 }} numberOfLines={1}>
          {priceLabel}
        </AppText>
      </View>
    </View>
  );
}
