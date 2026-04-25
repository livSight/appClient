import React from "react";
import { Iconify } from "react-native-iconify/native";
import type { StyleProp, ViewStyle } from "react-native";

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function SolarIcon({ name, size = 24, color, style, testID }: Props) {
  return <Iconify icon={name} size={size} color={color} style={style} testID={testID} />;
}

