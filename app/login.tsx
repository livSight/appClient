import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import ScreenLayout from "../components/ScreenLayout";
import { colors, radii, spacing, typography } from "../theme/tokens";
import { setVendorToken } from "@/lib/auth/token";
import { vendorLogin } from "@/lib/api/vendor";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { token } = await vendorLogin(email.trim(), password);
      await setVendorToken(token);
      router.replace("/(tabs)/livraison");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      <View style={{ marginBottom: spacing.sectionGap / 2 }}>
        <Text style={typography.screenTitle}>Connexion</Text>
        <Text style={[typography.subtitle, { marginTop: 8 }]}>
          Connectez-vous pour accéder à vos livraisons.
        </Text>
      </View>

      <View style={{ gap: 14 }}>
        <View
          style={{
            borderRadius: radii.pill,
            backgroundColor: "#EEF2F7",
            paddingHorizontal: 18,
            height: 56,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="#8A8F98"
            style={{ fontSize: 16, color: colors.text }}
          />
        </View>

        <View
          style={{
            borderRadius: radii.pill,
            backgroundColor: "#EEF2F7",
            paddingHorizontal: 18,
            height: 56,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Mot de passe"
            placeholderTextColor="#8A8F98"
            style={{ fontSize: 16, color: colors.text }}
          />
        </View>

        {error ? (
          <Text style={{ color: "#D32F2F", fontWeight: "600" }}>{error}</Text>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={{
            height: 56,
            borderRadius: radii.pill,
            backgroundColor: submitting ? "#90BFD8" : colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 6,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={typography.buttonTextInverse}>Se connecter</Text>
          )}
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

