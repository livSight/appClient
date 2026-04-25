import { TextInput, type TextInputProps } from "react-native";

export type AppTextInputVariant = "default" | "dense";

type Props = TextInputProps & {
  variant?: AppTextInputVariant;
};

const DEFAULT_MAX = 2.5;
const DENSE_MAX = 2.0;

export default function AppTextInput({
  variant = "default",
  allowFontScaling,
  maxFontSizeMultiplier,
  ...rest
}: Props) {
  const computedMax =
    maxFontSizeMultiplier ?? (variant === "dense" ? DENSE_MAX : DEFAULT_MAX);

  return (
    <TextInput
      allowFontScaling={allowFontScaling ?? true}
      maxFontSizeMultiplier={computedMax}
      {...rest}
    />
  );
}

