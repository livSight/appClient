import { View } from "react-native";
import AppText from "@/components/AppText";
import SolarIcon from "@/components/SolarIcon";
import { card } from "@/theme/styles";
import { colors, fonts, radii, typography } from "@/theme/tokens";

type LineItem = { k: string; v: string };

type Props = {
  amountHeaderLabel: string;
  amountXaf: number;
  lines: LineItem[];
  showCollectCashBadge?: boolean;
};

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

export default function TransactionDetailCardExpedition({ amountHeaderLabel, amountXaf, lines, showCollectCashBadge }: Props) {
  return (
    <View style={[card.base, { padding: 24 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <AppText variant="dense" style={{ ...typography.label, color: "rgba(60,74,60,0.65)" }} numberOfLines={1}>
            {amountHeaderLabel}
          </AppText>
          <AppText style={{ fontSize: 34, lineHeight: 40, fontFamily: fonts.bodyBold, color: colors.text, marginTop: 8 }} numberOfLines={1}>
            {formatFcfa(amountXaf)}{" "}
            <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
              FCFA
            </AppText>
          </AppText>
        </View>
      </View>

      <View style={{ marginTop: 18, gap: 12 }}>
        {lines.map((line) => (
          <View key={line.k} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }} numberOfLines={2} ellipsizeMode="tail">
                {line.k}
              </AppText>
            </View>
            <View style={{ flexShrink: 0, maxWidth: 180 }}>
              <AppText style={{ fontSize: 13, lineHeight: 18, fontFamily: fonts.bodySemi, color: colors.text, textAlign: "right" }} numberOfLines={2} ellipsizeMode="tail">
                {line.v}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      {showCollectCashBadge ? (
        <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
          <View
            style={{
              minHeight: 36,
              borderRadius: radii.pill,
              backgroundColor: "rgba(14,165,233,0.12)",
              borderWidth: 1,
              borderColor: "rgba(14,165,233,0.18)",
              paddingHorizontal: 14,
              paddingVertical: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <SolarIcon name="solar:card-outline" size={22} color={colors.primary} />
            <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
              Paiement à la livraison
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

