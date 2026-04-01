import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "../theme/styles";
import { spacing } from "../theme/tokens";

type Props = {
  children: React.ReactNode;
  /** Use false for screens that shouldn't scroll (e.g. a map screen) */
  scrollable?: boolean;
};

/**
 * Wraps every screen with the correct background, safe-area padding,
 * and horizontal gutters. Import this instead of writing ScrollView boilerplate.
 */
export default function ScreenLayout({ children, scrollable = true }: Props) {
  const insets = useSafeAreaInsets();

  const contentStyle = [
    layout.scrollContent,
    {
      paddingTop: Math.max(spacing.screenPaddingX, insets.top + spacing.screenPaddingX),
      paddingBottom: Math.max(24, insets.bottom + 24),
    },
  ];

  if (!scrollable) {
    return (
      <View style={[layout.screen, contentStyle[0], { paddingTop: contentStyle[1].paddingTop }]}>
        {children}
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
