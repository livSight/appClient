import { Pressable, View } from "react-native";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";

type Props = {
  locationLabel: string;
  onProfilePress?: () => void;
  initials?: string;
};

export default function HomeTopBar({ locationLabel, onProfilePress, initials }: Props) {
  return (
    <View
      style={{
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10 }}>
        <SolarIcon name="solar:map-point-outline" size={24} color={colors.primary} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 }} numberOfLines={1} ellipsizeMode="tail">
            {locationLabel}
          </AppText>
        </View>
      </View>

      <Pressable
        hitSlop={10}
        onPress={onProfilePress}
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          backgroundColor: "#EDEEEF",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 12,
        }}
      >
        <AppText variant="dense" style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
          {(initials?.trim() || "A").toUpperCase()}
        </AppText>
      </Pressable>
    </View>
  );
}
