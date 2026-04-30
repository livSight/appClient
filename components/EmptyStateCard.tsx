import { View } from "react-native";
import AppText from "./AppText";
import PillButton from "./PillButton";
import SolarIcon from "./SolarIcon";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";

export type EmptyStateCta = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "white";
};

type Props = {
  label: string;
  iconName: string;
  title: string;
  subtitle?: string;
  ctas?: EmptyStateCta[];
};

export default function EmptyStateCard({ label, iconName, title, subtitle, ctas }: Props) {
  const visibleCtas = ctas?.filter(Boolean) ?? [];

  return (
    <View style={[card.base, { padding: 16 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <AppText
          variant="dense"
          style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.55)", letterSpacing: 0.4, textAlign: "center" }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
          <SolarIcon name={iconName} size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <AppText
            style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 20 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              variant="dense"
              style={{ ...typography.subtitle, fontSize: 11, lineHeight: 16, marginTop: 3 }}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      {visibleCtas.length > 0 ? (
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            alignSelf: "stretch",
          }}
        >
          {visibleCtas.map((cta) => (
            <PillButton
              key={cta.label}
              label={cta.label}
              variant={cta.variant ?? "primary"}
              onPress={cta.onPress}
              style={{ flex: 1, paddingHorizontal: 12 }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
