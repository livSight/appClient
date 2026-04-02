import { View, Text, Pressable } from "react-native";
import { card } from "../theme/styles";
import { colors, typography } from "../theme/tokens";

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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>{title}</Text>
          <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 4 }}>
            {meta}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: colors.primary }}>{amount}</Text>
          <Text style={{ ...typography.subtitle, fontSize: 10, lineHeight: 14, marginTop: 6 }}>
            {tag}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
