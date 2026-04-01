import { Pressable, View, Text } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { card, icon } from "../theme/styles";
import { colors, typography } from "../theme/tokens";

type Props = {
  title: string;
  subtitle: string;
  width: number;
  Icon?: LucideIcon;
  selected?: boolean;
  onPress?: () => void;
};

/**
 * Square category card used in the 2-column grid on the Accueil screen.
 * Width must be passed by the parent (computed from screen width).
 */
export default function CategoryCard({ title, subtitle, width, Icon, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[card.base, { width }, selected && card.selectedBorder]}
    >
      <View style={{ height: 80, alignItems: "center", justifyContent: "center" }}>
        <View style={icon.container}>
          {Icon ? <Icon size={26} color={colors.primary} /> : <View style={icon.dot} />}
        </View>
      </View>

      <View style={{ alignItems: "center" }}>
        <Text style={typography.cardTitle}>{title}</Text>
        <Text style={[typography.cardSubtitle, { marginTop: 4 }]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}
