import { Pressable } from "react-native";
import { button } from "../theme/styles";
import { typography } from "../theme/tokens";
import AppText from "./AppText";

type Variant = "primary" | "white";

type Props = {
  label: string;
  variant?: Variant;
  onPress?: () => void;
  style?: object;
};

/**
 * Rounded pill button. Two variants:
 *   - "primary" → blue background, white text
 *   - "white"   → white background, blue text  (use on colored backgrounds)
 */
export default function PillButton({ label, variant = "primary", onPress, style }: Props) {
  const bgStyle = variant === "white" ? button.pillWhite : button.pillPrimary;
  const textStyle =
    variant === "white" ? typography.buttonText : typography.buttonTextInverse;

  return (
    <Pressable onPress={onPress} style={[button.pill, bgStyle, style]}>
      <AppText style={[textStyle, { textAlign: "center" }]} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}
