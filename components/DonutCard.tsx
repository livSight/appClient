import { View, useWindowDimensions } from "react-native";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";
import { card, row } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";

type Legend = {
  delivered: string;
  injoignable: string;
  annule: string;
};

type Props = {
  successPct: number;
  legend: Legend;
};

function Donut({ pct }: { pct: number }) {
  return (
    <View style={{ width: 140, height: 140, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: 9999,
          borderWidth: 14,
          borderColor: "#E5E7EB",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 140,
          height: 140,
          borderRadius: 9999,
          borderWidth: 14,
          borderColor: "#22C55E",
          borderRightColor: "#F59E0B",
          borderTopColor: "#EF4444",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <AppText style={{ fontSize: 26, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
        {pct}%
      </AppText>
      <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
        de reussite
      </AppText>
    </View>
  );
}

function LegendRow({ label, rightText, color }: { label: string; rightText: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: color, flexShrink: 0 }} />
        <AppText
          variant="dense"
          style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, flex: 1 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </AppText>
      </View>
      <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.text, flexShrink: 0 }} numberOfLines={1}>
        {rightText}
      </AppText>
    </View>
  );
}

export default function DonutCard({ successPct, legend }: Props) {
  const { width } = useWindowDimensions();
  const inline = width >= 380;

  return (
    <View style={[card.base, { padding: 24, overflow: "hidden" }]}>
      <View style={{ ...row.start, gap: 10, alignItems: "center" }}>
        <SolarIcon name="solar:chart-bold-duotone" size={32} color={colors.primary} />
        <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20, flex: 1 }} numberOfLines={2} ellipsizeMode="tail">
          Taux de réussite
        </AppText>
      </View>

      {inline ? (
        <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View style={{ flexShrink: 0 }}>
            <Donut pct={successPct} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <LegendRow label="Livré" rightText={legend.delivered} color="#22C55E" />
            <LegendRow label="Client injoignable" rightText={legend.injoignable} color="#F59E0B" />
            <LegendRow label="Annulé" rightText={legend.annule} color="#EF4444" />
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <View style={{ alignItems: "center" }}>
            <Donut pct={successPct} />
          </View>
          <View style={{ marginTop: 10 }}>
            <LegendRow label="Livré" rightText={legend.delivered} color="#22C55E" />
            <LegendRow label="Client injoignable" rightText={legend.injoignable} color="#F59E0B" />
            <LegendRow label="Annulé" rightText={legend.annule} color="#EF4444" />
          </View>
        </View>
      )}
    </View>
  );
}
