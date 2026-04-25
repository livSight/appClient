import { Pressable, View } from "react-native";
import { MessageCircleMore } from "lucide-react-native";
import { card, icon } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "./AppText";

type Props = {
  title: string;
  meta: string;
  onPress?: () => void;
  onQuickActionPress?: () => void;
};

export default function HomeRecentOrderCard({ title, meta, onPress, onQuickActionPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[card.outlined, { position: "relative", padding: 20, overflow: "visible" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[icon.placeholder, { backgroundColor: "#F3F4F5", borderRadius: 24, marginRight: 16 }]} />

        <View style={{ flex: 1, minWidth: 0, paddingRight: 56 }}>
          <AppText
            style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </AppText>
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, color: "rgba(60,74,60,0.6)", marginTop: 6 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {meta}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={onQuickActionPress}
        hitSlop={10}
        style={{
          position: "absolute",
          right: 18,
          bottom: -18,
          width: 64,
          height: 64,
          borderRadius: radii.pill,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <MessageCircleMore size={22} color={colors.white} />
      </Pressable>
    </Pressable>
  );
}

