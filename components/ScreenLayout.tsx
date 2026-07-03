import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "../theme/styles";
import { colors, spacing } from "../theme/tokens";
import HeroGridBackground from "./HeroGridBackground";

type Props = {
  children: React.ReactNode;
  /** Use false for screens that shouldn't scroll (e.g. a map screen) */
  scrollable?: boolean;
  /** Rendered above the ScrollView so it stays fixed while content scrolls */
  header?: React.ReactNode;
  /** Rendered below the ScrollView so it stays fixed while content scrolls */
  footer?: React.ReactNode;
  /** Optional props forwarded to the internal ScrollView (e.g. ref/keyboardShouldPersistTaps) */
  scrollViewProps?: Omit<ScrollViewProps, "children">;
  /** Optional ref to the internal ScrollView (for scrollTo on deep-links) */
  scrollViewRef?: React.Ref<ScrollView>;
};

/**
 * Wraps every screen with the correct background, safe-area padding,
 * and horizontal gutters. Import this instead of writing ScrollView boilerplate.
 */
export default function ScreenLayout({ children, scrollable = true, header, footer, scrollViewProps, scrollViewRef }: Props) {
  const insets = useSafeAreaInsets();

  const topPadding = Math.max(spacing.screenPaddingX, insets.top + spacing.screenPaddingX);
  const bottomPadding = Math.max(24, insets.bottom + 24);
  const footerSpacer = footer ? 120 : 0;
  const background = colors.white;

  if (header) {
    return (
      <KeyboardAvoidingView
        style={[layout.screen, { backgroundColor: background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <HeroGridBackground />
        <View
          style={{
            paddingTop: topPadding,
            paddingHorizontal: spacing.screenPaddingX,
            backgroundColor: "transparent",
          }}
        >
          {header}
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.screenPaddingX,
            paddingBottom: bottomPadding + footerSpacer,
          }}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    );
  }

  const contentStyle = [
    layout.scrollContent,
    { paddingTop: topPadding, paddingBottom: bottomPadding + footerSpacer },
  ];

  if (!scrollable) {
    return (
      <View style={[layout.screen, contentStyle[0], { paddingTop: topPadding, backgroundColor: background }]}>
        <HeroGridBackground />
        {children}
      </View>
    );
  }

  if (footer) {
    return (
      <KeyboardAvoidingView
        style={[layout.screen, { backgroundColor: background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <HeroGridBackground />
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[layout.screen, { backgroundColor: background }]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
      {...scrollViewProps}
    >
      <HeroGridBackground />
      {children}
    </ScrollView>
  );
}
