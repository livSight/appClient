import { StyleSheet } from "react-native";
import { colors, radii, spacing, shadows } from "./tokens";

// Reusable StyleSheet objects — import these in screens instead of writing inline styles.

export const layout = StyleSheet.create({
  // Full-screen scroll container background
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Standard horizontal + bottom padding for ScrollView contentContainerStyle
  // (combine with dynamic paddingTop using insets in each screen)
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingX,
    paddingBottom: 24,
  },
});

export const card = StyleSheet.create({
  base: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    ...shadows.card,
  },
  outlined: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  selectedBorder: {
    borderWidth: 5,
    borderColor: colors.primary,
  },
});

export const button = StyleSheet.create({
  pill: {
    borderRadius: radii.pill,
    minHeight: 44,
    paddingHorizontal: 24,
    paddingVertical: 10,
    justifyContent: "center" as const,
    alignSelf: "flex-start" as const,
  },
  pillPrimary: {
    backgroundColor: colors.primary,
  },
  pillWhite: {
    backgroundColor: colors.white,
  },
});

export const icon = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.iconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: radii.icon,
    backgroundColor: colors.placeholderBg,
  },
});

export const row = StyleSheet.create({
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
