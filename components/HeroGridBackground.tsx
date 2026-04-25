import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Pattern, Path, Rect } from "react-native-svg";
import { colors } from "../theme/tokens";

type Props = {
  opacity?: number;
  color?: string;
};

const CELL = 40;
const DEFAULT_STROKE_OPACITY = 0.60;

function HeroGridBackgroundImpl({ opacity = 0.12, color = colors.primary }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" patternUnits="userSpaceOnUse" width={CELL} height={CELL}>
            <Path d={`M0 1H${CELL}`} stroke={color} strokeOpacity={DEFAULT_STROKE_OPACITY} strokeWidth={1} />
            <Path d={`M1 0V${CELL}`} stroke={color} strokeOpacity={DEFAULT_STROKE_OPACITY} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#grid)" opacity={opacity} />
      </Svg>
    </View>
  );
}

const HeroGridBackground = memo(HeroGridBackgroundImpl);
export default HeroGridBackground;

