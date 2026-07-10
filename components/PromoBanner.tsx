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
        paddingTop: 28,
        paddingBottom: 28,
        minHeight: 190,
        justifyContent: "center",
        overflow: "hidden",
        marginBottom: spacing.sectionGap,
      }}
    >
      <AppText variant="dense" style={typography.label} numberOfLines={1}>
        {label}
      </AppText>
      <AppText style={[typography.bannerTitle, { marginTop: 8 }]}>
        {title}
      </AppText>
      <PillButton
        label={ctaLabel}
        variant="white"
        style={{ marginTop: 16 }}
        onPress={onPress ?? (() => router.push("/ma-demande-livraison"))}
      />
    </LinearGradient>
  );
}
