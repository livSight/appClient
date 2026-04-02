import { View, Text, Pressable } from "react-native";
import { card, icon } from "../theme/styles";
import { colors, typography } from "../theme/tokens";

type Props = {
  title: string;
  subtitle: string;
  rightTop?: string;
  rightBottom?: string;
  onPress?: () => void;
};

/**
 * Outlined row card for displaying an order summary.
 * Shows a placeholder image, title, subtitle, and a right-pointing chevron.
 */
export default function OrderCard({ title, subtitle, rightTop, rightBottom, onPress }: Props) {
  const hasRight = Boolean(rightTop || rightBottom);
  return (
    <Pressable
      onPress={onPress}
      style={[card.outlined, { flexDirection: "row", alignItems: "center" }]}
    >
      <View style={[icon.placeholder, { marginRight: 16 }]} />

      <View style={{ flex: 1 }}>
        <Text style={typography.cardTitle}>{title}</Text>
        <Text style={[typography.bodyRegular, { color: colors.muted, marginTop: 4 }]}>
          {subtitle}
        </Text>
      </View>

      {hasRight ? (
        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
          {rightTop ? (
            <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>{rightTop}</Text>
          ) : null}
          {rightBottom ? (
            <Text style={{ ...typography.subtitle, fontSize: 10, lineHeight: 14, marginTop: 6 }}>
              {rightBottom}
            </Text>
          ) : null}
        </View>
      ) : (
        // Chevron
        <View
          style={{
            width: 10,
            height: 10,
            borderRightWidth: 2,
            borderTopWidth: 2,
            borderColor: colors.text,
            transform: [{ rotate: "45deg" }],
          }}
        />
      )}
    </Pressable>
  );
}
