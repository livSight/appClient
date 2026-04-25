import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import AppText from "./AppText";
import { colors, fonts, radii } from "../theme/tokens";

type Props = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional trailing icon rendered to the right of the label */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
};

/**
 * Full-width primary CTA button for forms and action bars.
 * Renders disabled state as semi-transparent.
 *
 * Usage:
 *   <FormButton label="Continuer" onPress={handleSubmit} disabled={!isValid} />
 */
export default function FormButton({ label, onPress, disabled = false, style, icon: Icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          minHeight: 56,
          borderRadius: radii.pill,
          paddingVertical: 14,
          paddingHorizontal: 24,
          backgroundColor: disabled ? "rgba(41,127,198,0.45)" : colors.primary,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: disabled ? 0 : 0.18,
          shadowRadius: 16,
          elevation: disabled ? 0 : 6,
        },
        style,
      ]}
    >
      <AppText
        style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.white }}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {Icon ? <Icon size={18} color={colors.white} /> : null}
    </Pressable>
  );
}
