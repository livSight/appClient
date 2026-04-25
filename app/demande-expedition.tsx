import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { colors, fonts, typography } from "../theme/tokens";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import FormInput from "../components/FormInput";
import FormButton from "../components/FormButton";
import { hapticSuccess } from "@/lib/haptics";
import { stringifyExpeditionClient } from "@/lib/expeditionClient";

const SUBTITLE_MUTED = "rgba(60,74,60,0.7)";

export default function DemandeExpeditionScreen() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const canContinue = useMemo(() => {
    return clientName.trim().length > 0 && phone.trim().length > 0 && address.trim().length > 0;
  }, [clientName, phone, address]);

  return (
    <ScreenLayout
      footer={
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#EDEEEF",
            backgroundColor: "rgba(255,255,255,0.95)",
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <FormButton
            label="Continuer"
            icon={ArrowRight}
            disabled={!canContinue}
            onPress={async () => {
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
            }}
          />
          {!canContinue ? (
            <AppText
              variant="dense"
              style={{ marginTop: 8, textAlign: "center", fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.5)" }}
              numberOfLines={2}
            >
              Complétez tous les champs obligatoires pour continuer
            </AppText>
          ) : null}
        </View>
      }
    >
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, marginBottom: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{ width: 44, height: 44, justifyContent: "center" }}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
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

      <View style={{ marginTop: 28, gap: 20 }}>
        <FormInput
          label="Nom du client"
          value={clientName}
          onChangeText={setClientName}
          placeholder="Jean Fotso"
          autoCapitalize="words"
        />
        <FormInput
          label="Numéro de téléphone"
          value={phone}
          onChangeText={setPhone}
          placeholder="6XXXXXX"
          keyboardType="phone-pad"
        />
        <FormInput
          label="Adresse du client"
          value={address}
          onChangeText={setAddress}
          placeholder="Chapelle Manguier"
          multiline
        />
        <FormInput
          label="Autres informations (optionnel)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Le client souhaite être livré après 13h"
          multiline
        />
      </View>
    </ScreenLayout>
  );
}
