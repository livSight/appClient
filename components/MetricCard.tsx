import { View } from "react-native";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";
import { card, row } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";

function parseDelta(delta: string): "positive" | "negative" | "neutral" {
  const trimmed = delta.trim();
  if (trimmed.startsWith("+")) return "positive";
  if (trimmed.startsWith("-")) return "negative";
  return "neutral";
}

type Props = {
  title: string;
  value: string;
  suffix?: string;
  delta?: string;
  iconName: string;
  compact?: boolean;
};

export default function MetricCard({ title, value, suffix, delta, iconName, compact }: Props) {
  if (compact) {
    return (
      <View style={[card.base, { padding: 16, minHeight: 110, justifyContent: "center" }]}>
        <SolarIcon name={iconName} size={24} color={colors.primary} />
        <AppText
          variant="dense"
          style={{ ...typography.subtitle, fontSize: 11, lineHeight: 15, marginTop: 6 }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 8, minWidth: 0 }}>
          <AppText style={{ fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
            {value}
          </AppText>
          {suffix ? (
            <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 10, marginLeft: 4, marginBottom: 3, flexShrink: 0 }} numberOfLines={1}>
              {suffix}
            </AppText>
          ) : null}
        </View>
        </View>
    );
  }

  return (
    <View style={[card.base, { padding: 20, minHeight: 120, justifyContent: "center" }]}>
      <View style={{ ...row.spaceBetween }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.pill,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SolarIcon name={iconName} size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText
              variant="dense"
              style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 12, minWidth: 0 }}>
        <AppText style={{ fontSize: 24, fontFamily: fonts.bodyBold, color: colors.text, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </AppText>
        {suffix ? (
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, marginLeft: 8, marginBottom: 4, flexShrink: 0 }}
            numberOfLines={1}
          >
            {suffix}
          </AppText>
        ) : null}
      </View>

    </View>
  );
}
