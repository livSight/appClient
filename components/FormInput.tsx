import { View, type TextInputProps } from "react-native";
import AppText from "./AppText";
import AppTextInput from "./AppTextInput";
import { colors, fonts } from "../theme/tokens";
import SolarIcon from "./SolarIcon";

const INPUT_BG = "#F3F4F5";
const INPUT_RADIUS = 24;
const PH = "rgba(60,74,60,0.4)";

type Props = TextInputProps & {
  /** Field label rendered above the input */
  label?: string;
  /** Icon rendered on the left inside the input */
  leadingIconName?: string;
  leadingIconSize?: number;
  leadingIconColor?: string;
  /** Element rendered on the right inside the input (e.g. currency tag) */
  trailing?: React.ReactNode;
};

/**
 * Reusable form field: optional label + styled input container.
 * Passes all TextInputProps through to AppTextInput.
 *
 * Usage:
 *   <FormInput label="Adresse" placeholder="Ex: Bastos..." value={v} onChangeText={set} />
 *   <FormInput label="Quantité" leadingIcon={Hash} keyboardType="number-pad" ... />
 *   <FormInput label="Montant" trailing={<AppText>XAF</AppText>} ... />
 *   <FormInput label="Instructions" multiline ... />
 */
export default function FormInput({
  label,
  leadingIconName,
  leadingIconSize = 18,
  leadingIconColor = PH,
  trailing,
  multiline,
  style,
  ...rest
}: Props) {
  const hasAdornment = Boolean(leadingIconName) || Boolean(trailing);

  return (
    <View>
      {label ? (
        <AppText
          style={{
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.bodySemi,
            color: colors.text,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {label}
        </AppText>
      ) : null}

      <View
        style={{
          minHeight: multiline ? 128 : 56,
          borderRadius: INPUT_RADIUS,
          backgroundColor: INPUT_BG,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: hasAdornment ? "row" : undefined,
          alignItems: hasAdornment ? "center" : undefined,
          justifyContent: multiline || hasAdornment ? undefined : "center",
          gap: hasAdornment ? 10 : undefined,
        }}
      >
        {leadingIconName ? <SolarIcon name={leadingIconName} size={leadingIconSize} color={leadingIconColor} /> : null}

        <AppTextInput
          placeholderTextColor={PH}
          multiline={multiline}
          style={[
            {
              fontSize: 16,
              lineHeight: 22,
              fontFamily: fonts.bodyRegular,
              color: colors.text,
              flex: hasAdornment || multiline ? 1 : undefined,
            },
            style,
          ]}
          {...rest}
        />

        {trailing ?? null}
      </View>
    </View>
  );
}
