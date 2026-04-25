import { View, Pressable, useWindowDimensions, StyleSheet } from "react-native";
import { colors, fonts, radii, shadows, spacing, typography } from "../theme/tokens";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";

export type CategoryItem = {
  title: string;
  iconName: string;
  onPress?: () => void;
};

type Props = {
  items: CategoryItem[];
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.card,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
    ...shadows.card,
  },
});

export default function CategoryGrid({ items }: Props) {
  const { width } = useWindowDimensions();
  const totalGap = spacing.gridColGap * (items.length - 1);
  const cardWidth = (width - spacing.screenPaddingX * 2 - totalGap) / items.length;

  return (
    <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={[styles.card, { width: cardWidth }]}
        >
          <SolarIcon name={item.iconName} size={28} color={colors.primary} />
          <AppText
            style={{
              ...typography.cardTitle,
              fontSize: 11,
              lineHeight: 14,
              fontFamily: fonts.bodySemi,
              marginTop: 6,
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
