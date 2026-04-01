import { View, Text, Pressable } from "react-native";
import { card, icon } from "../theme/styles";
import { colors, typography } from "../theme/tokens";

type Props = {
  title: string;
  subtitle: string;
  onPress?: () => void;
};

/**
 * Outlined row card for displaying an order summary.
 * Shows a placeholder image, title, subtitle, and a right-pointing chevron.
 */
export default function OrderCard({ title, subtitle, onPress }: Props) {
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

      {/* Chevron */}
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
    </Pressable>
  );
}
