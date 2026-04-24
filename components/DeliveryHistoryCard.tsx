import { View, Pressable } from "react-native";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";
import AppText from "./AppText";

type Props = {
  title: string;
  meta: string;
  amount: string;
  tag: string;
  onPress?: () => void;
};

export default function DeliveryHistoryCard({ title, meta, amount, tag, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[card.outlined, { padding: 16 }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </AppText>
          <AppText
            style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 4 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {meta}
          </AppText>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 12, flexShrink: 0 }}>
          <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1} ellipsizeMode="tail">
            {amount}
          </AppText>
          <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 10, lineHeight: 14, marginTop: 6 }} numberOfLines={1} ellipsizeMode="tail">
            {tag}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
