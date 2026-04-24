import { StyleSheet, Text, useWindowDimensions, type TextProps } from "react-native";

export type AppTextVariant = "default" | "dense";

type Props = TextProps & {
  /**
   * Use "dense" for compact UI (e.g. tabs/pills) where extremely large fonts
   * would otherwise cause excessive vertical growth.
   */
  variant?: AppTextVariant;
};

const DEFAULT_MAX = 2.5;
const DENSE_MAX = 2.0;

export default function AppText({
  variant = "default",
  allowFontScaling,
  maxFontSizeMultiplier,
  style,
  ...rest
}: Props) {
  const computedMax =
    maxFontSizeMultiplier ?? (variant === "dense" ? DENSE_MAX : DEFAULT_MAX);

  // React Native scales fontSize via allowFontScaling but never scales lineHeight,
  // causing text to clip at high accessibility font sizes. Fix: multiply lineHeight
  // by the same effective scale factor that RN applies to fontSize.
  // useWindowDimensions() is reactive — re-renders when the user changes font size
  // while the app is in the foreground.
  const { fontScale } = useWindowDimensions();
  const effectiveScale = Math.min(fontScale, computedMax);
  const flatStyle = StyleSheet.flatten(style ?? {});
  const lineHeightOverride =
    effectiveScale > 1 && flatStyle.lineHeight != null
      ? { lineHeight: Math.round(flatStyle.lineHeight * effectiveScale) }
      : null;

  return (
    <Text
      allowFontScaling={allowFontScaling ?? true}
      maxFontSizeMultiplier={computedMax}
      style={lineHeightOverride ? [style, lineHeightOverride] : style}
      {...rest}
    />
  );
}

