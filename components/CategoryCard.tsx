import { Pressable, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { card, icon } from "../theme/styles";
import { colors, typography } from "../theme/tokens";
import AppText from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
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
  const hasSubtitle = Boolean(subtitle && subtitle.trim().length > 0);
  return (
    <Pressable
      onPress={onPress}
      style={[card.base, { width }, selected && card.selectedBorder]}
    >
      <View style={{ minHeight: 80, paddingVertical: 12, alignItems: "center", justifyContent: "center" }}>
        <View style={icon.container}>
          {Icon ? <Icon size={26} color={colors.primary} /> : <View style={icon.dot} />}
        </View>
      </View>

      <View style={{ alignItems: "center" }}>
        <AppText style={typography.cardTitle} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </AppText>
        {hasSubtitle ? (
          <AppText
            style={[typography.cardSubtitle, { marginTop: 4 }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
