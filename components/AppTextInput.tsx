import { forwardRef } from "react";
import { TextInput, type TextInputProps } from "react-native";

export type AppTextInputVariant = "default" | "dense";

type Props = TextInputProps & {
  variant?: AppTextInputVariant;
};

const DEFAULT_MAX = 2.5;
const DENSE_MAX = 2.0;

const AppTextInput = forwardRef<TextInput, Props>(function AppTextInput(
  { variant = "default", allowFontScaling, maxFontSizeMultiplier, ...rest },
  ref,
) {
  const computedMax =
    maxFontSizeMultiplier ?? (variant === "dense" ? DENSE_MAX : DEFAULT_MAX);

  return (
    <TextInput
      ref={ref}
      allowFontScaling={allowFontScaling ?? true}
      maxFontSizeMultiplier={computedMax}
      {...rest}
    />
  );
});

export default AppTextInput;
