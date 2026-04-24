import { View, Pressable } from "react-native";
import { card, icon } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";
import AppText from "./AppText";

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

      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText style={typography.cardTitle} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </AppText>
        <AppText
          style={[typography.bodyRegular, { color: colors.muted, marginTop: 4 }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {subtitle}
        </AppText>
      </View>

      {hasRight ? (
        <View style={{ alignItems: "flex-end", marginLeft: 12, flexShrink: 0 }}>
          {rightTop ? (
            <AppText
              variant="dense"
              style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {rightTop}
            </AppText>
          ) : null}
          {rightBottom ? (
            <AppText
              variant="dense"
              style={{ ...typography.subtitle, fontSize: 10, lineHeight: 14, marginTop: 6 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {rightBottom}
            </AppText>
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
