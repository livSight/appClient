import { View, Text, Pressable } from "react-native";
import { row } from "../theme/styles";
import { typography } from "../theme/tokens";

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
      <Text style={typography.sectionTitle}>{title}</Text>
      {linkLabel && (
        <Pressable onPress={onLinkPress} hitSlop={8}>
          <Text style={typography.link}>{linkLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
