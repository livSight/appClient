import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import AppText from "@/components/AppText";
import FormButton from "@/components/FormButton";
import FormInput from "@/components/FormInput";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { AuthError } from "@/lib/auth/authApi";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hapticError, hapticLight, hapticSuccess } from "@/lib/haptics";
import { colors, fonts, spacing, typography } from "@/theme/tokens";

const SUBTITLE_MUTED = "rgba(60,74,60,0.7)";
const ERROR_BG = "rgba(211,47,47,0.10)";
const ERROR_FG = "#B91C1C";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !isSubmitting,
    [email, password, isSubmitting],
  );

  async function handleSubmit() {
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await hapticLight();
      await login({ username: email.trim(), password });
      await hapticSuccess();
      router.replace("/(tabs)");
    } catch (e: unknown) {
      await hapticError();
      if (e instanceof AuthError && e.status === 401) {
        setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
      } else if (e instanceof AuthError) {
        setError(e.message);
      } else {
        setError("Une erreur est survenue. Réessayez.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenLayout
      scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
      footer={
        <View
          style={{
            backgroundColor: "transparent",
            paddingHorizontal: spacing.screenPaddingX,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <FormButton
            label={isSubmitting ? "Connexion…" : "Se connecter"}
            iconName="solar:alt-arrow-right-outline"
            disabled={!canSubmit}
            onPress={handleSubmit}
          />
        </View>
      }
    >
      <View style={{ alignItems: "center", marginTop: 8, marginBottom: 32 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <SolarIcon name="solar:user-id-bold-duotone" size={36} color={colors.primary} />
        </View>
        <AppText style={{ ...typography.screenTitle, textAlign: "center" }} numberOfLines={2}>
          Connexion
        </AppText>
        <AppText
          style={{ ...typography.subtitle, lineHeight: 26, marginTop: 10, color: SUBTITLE_MUTED, textAlign: "center" }}
          numberOfLines={3}
        >
          Connectez-vous pour accéder à vos livraisons et expéditions.
        </AppText>
      </View>

      {error ? (
        <View
          testID="login-error"
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            backgroundColor: ERROR_BG,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 20,
          }}
        >
          <SolarIcon name="solar:danger-circle-bold" size={20} color={ERROR_FG} />
          <AppText
            style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyMedium, color: ERROR_FG }}
            numberOfLines={4}
          >
            {error}
          </AppText>
        </View>
      ) : null}

      <View style={{ gap: 20 }}>
        <FormInput
          testID="login-email"
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          leadingIconName="solar:letter-outline"
        />
        <FormInput
          testID="login-password"
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          leadingIconName="solar:user-outline"
        />
      </View>
    </ScreenLayout>
  );
}
