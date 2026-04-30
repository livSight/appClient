import { View, Pressable, useWindowDimensions, StyleSheet } from "react-native";
import { colors, fonts, radii, shadows, spacing, typography } from "../theme/tokens";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";

export type CategoryItem = {
  title: string;
  iconName: string;
  onPress?: () => void;
};

type Variant = "row" | "grid";

type Props = {
  items: CategoryItem[];
  variant?: Variant;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
});

export default function CategoryGrid({ items, variant = "row" }: Props) {
  const { width } = useWindowDimensions();
  const isGrid = variant === "grid";
  const itemsPerRow = isGrid ? 2 : items.length;
  const totalGap = spacing.gridColGap * (itemsPerRow - 1);
  const cardWidth = (width - spacing.screenPaddingX * 2 - totalGap) / itemsPerRow;

  const iconSize = isGrid ? 44 : 28;
  const paddingVertical = isGrid ? 32 : 14;
  const labelFontSize = isGrid ? 16 : 11;
  const labelLineHeight = isGrid ? 22 : 14;
  const labelMarginTop = isGrid ? 14 : 6;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: isGrid ? "wrap" : "nowrap",
        gap: spacing.gridColGap,
      }}
    >
      {items.map((item) => (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={[styles.card, { width: cardWidth, paddingVertical, paddingHorizontal: 4 }]}
        >
          <SolarIcon name={item.iconName} size={iconSize} color={colors.primary} />
          <AppText
            style={{
              ...typography.cardTitle,
              fontSize: labelFontSize,
              lineHeight: labelLineHeight,
              fontFamily: fonts.bodyBold,
              marginTop: labelMarginTop,
              textAlign: "center",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.title}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
