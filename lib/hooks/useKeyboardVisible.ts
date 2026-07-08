import { useEffect, useState } from "react";
import { Keyboard, Platform, type KeyboardEvent } from "react-native";

export type KeyboardInsets = {
  visible: boolean;
  height: number;
};

export function useKeyboardInsets(): KeyboardInsets {
  const [insets, setInsets] = useState<KeyboardInsets>({ visible: false, height: 0 });

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: KeyboardEvent) => {
      setInsets({ visible: true, height: event.endCoordinates.height });
    };
    const onHide = () => {
      setInsets({ visible: false, height: 0 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return insets;
}

/** @deprecated Prefer useKeyboardInsets for scroll padding. */
export function useKeyboardVisible(): boolean {
  return useKeyboardInsets().visible;
}
