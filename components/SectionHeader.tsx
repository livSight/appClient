import { View, Pressable } from "react-native";
import { row } from "../theme/styles";
import { typography } from "../theme/tokens";
import AppText from "./AppText";

type Props = {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
  style?: object;
};

/**
 * Section title row with an optional right-aligned link (e.g. "Voir tout").
 *
 * Usage:
 *   <SectionHeader title="Dernière commande" linkLabel="Voir tout" onLinkPress={...} />
 */
export default function SectionHeader({ title, linkLabel, onLinkPress, style }: Props) {
  return (
    <View style={[row.spaceBetween, { marginBottom: 24 }, style]}>
      <AppText style={typography.sectionTitle} numberOfLines={2}>
        {title}
      </AppText>
      {linkLabel && (
        <Pressable onPress={onLinkPress} hitSlop={8}>
          <AppText style={typography.link} numberOfLines={1}>
            {linkLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
