import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "../theme/styles";
import { colors, spacing } from "../theme/tokens";

type Props = {
  children: React.ReactNode;
  /** Use false for screens that shouldn't scroll (e.g. a map screen) */
  scrollable?: boolean;
  /** Rendered above the ScrollView so it stays fixed while content scrolls */
  header?: React.ReactNode;
  /** Rendered below the ScrollView so it stays fixed while content scrolls */
  footer?: React.ReactNode;
};

/**
 * Wraps every screen with the correct background, safe-area padding,
 * and horizontal gutters. Import this instead of writing ScrollView boilerplate.
 */
export default function ScreenLayout({ children, scrollable = true, header, footer }: Props) {
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(spacing.screenPaddingX, insets.top + spacing.screenPaddingX);
  const bottomPadding = Math.max(24, insets.bottom + 24);

  if (header) {
    return (
      <View style={layout.screen}>
        <View
          style={{
            paddingTop: topPadding,
            paddingHorizontal: spacing.screenPaddingX,
            backgroundColor: colors.bg,
          }}
        >
          {header}
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenPaddingX,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer}
      </View>
    );
  }

  const contentStyle = [
    layout.scrollContent,
    { paddingTop: topPadding, paddingBottom: bottomPadding },
  ];

  if (!scrollable) {
    return (
      <View style={[layout.screen, contentStyle[0], { paddingTop: topPadding }]}>
        {children}
      </View>
    );
  }

  if (footer) {
    return (
      <View style={layout.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer}
      </View>
    );
  }

  return (
    <ScrollView
      style={layout.screen}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
