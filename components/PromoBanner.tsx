import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, radii, spacing, typography } from "../theme/tokens";
import AppText from "./AppText";
import PillButton from "./PillButton";

type Props = {
  label?: string;
  title?: string;
  ctaLabel?: string;
  onPress?: () => void;
};

export default function PromoBanner({
  label = "Offre de bienvenue",
  title = "Livraison gratuite sur\nvotre première commande",
  ctaLabel = "En profiter",
  onPress,
}: Props) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radii.card,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        overflow: "hidden",
        marginBottom: spacing.sectionGap,
      }}
    >
      {/* Decorative circles */}
      <View
        style={{
          position: "absolute",
          right: -20,
          bottom: -20,
          width: 160,
          height: 160,
          borderRadius: radii.pill,
          backgroundColor: "rgba(255,255,255,0.35)",
        }}
      />
      <View
        style={{
          position: "absolute",
          right: 0,
          top: -12,
          width: 96,
          height: 96,
          borderRadius: radii.pill,
          backgroundColor: "rgba(48,144,192,0.85)",
        }}
      />

      <AppText variant="dense" style={typography.label} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={[typography.bannerTitle, { marginTop: 6 }]}>
        {title}
      </AppText>
      <PillButton
        label={ctaLabel}
        variant="white"
        style={{ marginTop: 12 }}
        onPress={onPress ?? (() => router.push("/ma-demande-livraison"))}
      />
    </LinearGradient>
  );
}
