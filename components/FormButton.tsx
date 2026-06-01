import { useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import AppText from "./AppText";
import { colors, fonts, radii } from "../theme/tokens";
import SolarIcon from "./SolarIcon";

type Props = {
  label: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional trailing icon rendered to the right of the label */
  iconName?: string;
  iconSize?: number;
};

/**
 * Full-width primary CTA button for forms and action bars.
 * Renders disabled state as semi-transparent.
 *
 * Usage:
 *   <FormButton label="Continuer" onPress={handleSubmit} disabled={!isValid} />
 */
export default function FormButton({ label, onPress, disabled = false, style, iconName, iconSize = 18 }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isActive = disabled || submitting;
  const bg = isActive ? "#D1D5DB" : colors.primary;
  const fg = isActive ? "#374151" : colors.white;

  async function handlePress() {
    if (isActive) return;
    setSubmitting(true);
    try {
      await onPress();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isActive}
      style={[
        {
          minHeight: 56,
          borderRadius: radii.pill,
          paddingVertical: 14,
          paddingHorizontal: 24,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          shadowColor: isActive ? "transparent" : colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isActive ? 0 : 0.18,
          shadowRadius: 16,
          elevation: isActive ? 0 : 6,
        },
        style,
      ]}
    >
      <AppText
        style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: fg }}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {iconName ? <SolarIcon name={iconName} size={iconSize} color={fg} /> : null}
    </Pressable>
  );
}
