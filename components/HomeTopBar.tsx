import { Pressable, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "./AppText";

type Props = {
  locationLabel: string;
  agencyStatus?: "online" | "offline";
  onProfilePress?: () => void;
};

function StatusBadge({ status }: { status: "online" | "offline" }) {
  const label = status === "online" ? "EN LIGNE" : "HORS LIGNE";
  const bg = status === "online" ? "rgba(46,125,50,0.14)" : "rgba(211,47,47,0.14)";
  const fg = status === "online" ? "#2E7D32" : "#D32F2F";
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="dense" style={{ fontSize: 11, lineHeight: 14, fontFamily: fonts.bodyBold, color: fg, letterSpacing: 0.6 }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export default function HomeTopBar({ locationLabel, agencyStatus, onProfilePress }: Props) {
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
        <MapPin size={16} color={colors.text} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 }} numberOfLines={1} ellipsizeMode="tail">
            {locationLabel}
          </AppText>
        </View>
        {agencyStatus ? <StatusBadge status={agencyStatus} /> : null}
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
          A
        </AppText>
      </Pressable>
    </View>
  );
}

