import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { colors, fonts, radii, typography } from "../theme/tokens";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import AppTextInput from "../components/AppTextInput";
import { hapticError, hapticLight, hapticSuccess } from "@/lib/haptics";
import { stringifyExpeditionClient } from "@/lib/expeditionClient";

const INPUT_BG = "#F3F4F5";
const INPUT_RADIUS = 24;
const PLACEHOLDER = "rgba(60,74,60,0.4)";
const SUBTITLE_MUTED = "rgba(60,74,60,0.7)";

function FieldLabel({ children }: { children: string }) {
  return (
    <AppText
      style={{
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodySemi,
        color: colors.text,
        marginBottom: 8,
      }}
      numberOfLines={2}
    >
      {children}
    </AppText>
  );
}

export default function DemandeExpeditionScreen() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canContinue = useMemo(() => {
    return clientName.trim().length > 0 && phone.trim().length > 0 && address.trim().length > 0;
  }, [clientName, phone, address]);

  async function onContinue() {
    if (!canContinue) {
      setError("Veuillez renseigner le nom, le numéro et l’adresse du client.");
      await hapticError();
      return;
    }
    setError(null);
    await hapticSuccess();
    const expeditionClient = stringifyExpeditionClient({
      clientName: clientName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });
    router.push({
      pathname: "/ma-demande-expedition",
      params: { quartier: "", expeditionClient },
    });
  }

  return (
    <ScreenLayout>
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, marginBottom: 12 }}>
        <Pressable
          onPress={async () => {
            await hapticLight();
            router.back();
          }}
          hitSlop={10}
          style={{ width: 44, height: 44, justifyContent: "center" }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={{ width: 44 }} />
      </View>

      <AppText
        variant="dense"
        style={{
          fontSize: 12,
          lineHeight: 16,
          fontFamily: fonts.bodyBold,
          color: colors.primary,
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
        numberOfLines={1}
      >
        Expedition
      </AppText>

      <AppText style={{ ...typography.screenTitle, fontSize: 30, lineHeight: 36, marginTop: 8 }} numberOfLines={2}>
        Nouvelle demande
      </AppText>
      <AppText style={{ ...typography.subtitle, lineHeight: 26, marginTop: 10, color: SUBTITLE_MUTED }}>
        Remplissez les informations ci-dessous pour{"\n"}initier votre expédition.
      </AppText>

      <View style={{ marginTop: 28 }}>
        <FieldLabel>Nom du client</FieldLabel>
        <View
          style={{
            minHeight: 56,
            borderRadius: INPUT_RADIUS,
            backgroundColor: INPUT_BG,
            paddingHorizontal: 20,
            paddingVertical: 12,
            justifyContent: "center",
          }}
        >
          <AppTextInput
            value={clientName}
            onChangeText={setClientName}
            placeholder="Jean Fotso"
            placeholderTextColor={PLACEHOLDER}
            autoCapitalize="words"
            style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
          />
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <FieldLabel>Numero</FieldLabel>
        <View
          style={{
            minHeight: 56,
            borderRadius: INPUT_RADIUS,
            backgroundColor: INPUT_BG,
            paddingHorizontal: 20,
            paddingVertical: 12,
            justifyContent: "center",
          }}
        >
          <AppTextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="6XXXXXX"
            placeholderTextColor={PLACEHOLDER}
            keyboardType="phone-pad"
            style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
          />
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <FieldLabel>Adresse du client</FieldLabel>
        <View
          style={{
            minHeight: 88,
            borderRadius: INPUT_RADIUS,
            backgroundColor: INPUT_BG,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <AppTextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Chapelle Manguier"
            placeholderTextColor={PLACEHOLDER}
            multiline
            textAlignVertical="top"
            style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyRegular, color: colors.text, minHeight: 48 }}
          />
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <FieldLabel>Autres informations (optionnel)</FieldLabel>
        <View
          style={{
            minHeight: 88,
            borderRadius: INPUT_RADIUS,
            backgroundColor: INPUT_BG,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Le client souhaite être livré après 13h"
            placeholderTextColor={PLACEHOLDER}
            multiline
            textAlignVertical="top"
            style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyRegular, color: colors.text, minHeight: 48 }}
          />
        </View>
      </View>

      {error ? (
        <AppText variant="dense" style={{ marginTop: 14, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodySemi, color: "#E11D48" }} numberOfLines={3}>
          {error}
        </AppText>
      ) : null}

      <View style={{ marginTop: 28, marginBottom: 8 }}>
        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          style={{
            minHeight: 56,
            borderRadius: radii.pill,
            backgroundColor: canContinue ? colors.primary : "rgba(41,127,198,0.45)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            paddingVertical: 14,
          }}
        >
          <AppText style={{ ...typography.buttonTextInverse, fontFamily: fonts.bodyBold }} numberOfLines={1}>
            Continuer
          </AppText>
          <ArrowRight size={18} color={colors.white} />
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
