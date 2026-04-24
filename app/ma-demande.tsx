import { useMemo, useState } from "react";
import { ActivityIndicator, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronDown, ArrowRight } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import AppText from "../components/AppText";
import AppTextInput from "../components/AppTextInput";

function Label({ children }: { children: string }) {
  return (
    <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: 8 }} numberOfLines={2}>
      {children}
    </AppText>
  );
}

function Helper({ children }: { children: string }) {
  return (
    <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodySemi, color: "#6B7280", marginTop: 6 }}>
      {children}
    </AppText>
  );
}

function FieldContainer({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        minHeight: 56,
        borderRadius: radii.card,
        backgroundColor: "#F1F3F5",
        paddingHorizontal: 16,
        paddingVertical: 10,
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

export default function MaDemandeScreen() {
  const { quartier: quartierParam } = useLocalSearchParams<{ quartier?: string }>();
  const quartier = typeof quartierParam === "string" ? quartierParam : "";

  const [items, setItems] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [amountDueText, setAmountDueText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountDue = useMemo(() => {
    const cleaned = amountDueText.replace(/[^\d.,]/g, "").replace(",", ".");
    const n = cleaned.length ? Number(cleaned) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }, [amountDueText]);

  const canSubmit =
    quartier.trim().length > 0 &&
    items.trim().length > 0 &&
    phone.trim().length > 0 &&
    Number.isFinite(amountDue) &&
    amountDue > 0 &&
    !submitting;

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      // UI-only mode: no API call. Keep validation + loading state for UX.
      await hapticSuccess();
      router.push("/confirmee");
    } catch (e) {
      void hapticError();
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: 8, marginBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
            Livraison
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <AppText variant="dense" style={{ ...typography.link, letterSpacing: 1.2, marginBottom: 6 }} numberOfLines={2}>
        DÉTAILS DE L&apos;ENVOI
      </AppText>
      <AppText style={{ ...typography.screenTitle, fontSize: 32, lineHeight: 36 }} numberOfLines={2}>
        Nouvelle demande
      </AppText>
      <AppText style={{ ...typography.subtitle, marginTop: 10, marginBottom: 24 }}>
        Remplissez les informations ci-dessous pour{"\n"}initier votre livraison.
      </AppText>

      {/* Quartier */}
      <View style={{ marginBottom: 20 }}>
        <Label>Quartier</Label>
        <FieldContainer>
          <AppText style={{ ...typography.bodyRegular }}>
            {quartier || "—"}
          </AppText>
        </FieldContainer>
        {!quartier ? <Helper>Zone requise. Retournez sélectionner une zone.</Helper> : null}
      </View>

      {/* Nom */}
      <View style={{ marginBottom: 20 }}>
        <Label>Nom</Label>
        <FieldContainer>
          <AppTextInput
            value={items}
            onChangeText={setItems}
            placeholder="Ex: Panier de légumes bio"
            placeholderTextColor="#A0A5AE"
            style={typography.bodyRegular}
          />
        </FieldContainer>
      </View>

      {/* Numero */}
      <View style={{ marginBottom: 20 }}>
        <Label>Numero</Label>
        <FieldContainer>
          <AppTextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="6XXXXXX"
            placeholderTextColor="#A0A5AE"
            keyboardType="phone-pad"
            style={typography.bodyRegular}
          />
        </FieldContainer>
      </View>

      {/* Product selection */}
      <View style={{ marginBottom: 20 }}>
        <Label>Selectionner un produit</Label>
        <FieldContainer>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={typography.bodyRegular} numberOfLines={2} ellipsizeMode="tail">
                Choisir dans le stock
              </AppText>
            </View>
            <ChevronDown size={18} color="#9AA3AF" />
          </View>
        </FieldContainer>
        <Helper>Indisponible</Helper>
      </View>

      {/* Agency selection */}
      <View style={{ marginBottom: 20 }}>
        <Label>Selectionner une agence de livraison</Label>
        <FieldContainer>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={typography.bodyRegular} numberOfLines={2} ellipsizeMode="tail">
                Choisir une agence
              </AppText>
            </View>
            <ChevronDown size={18} color="#9AA3AF" />
          </View>
        </FieldContainer>
        <Helper>Indisponible</Helper>
      </View>

      {/* Description */}
      <View style={{ marginBottom: 20 }}>
        <Label>Description</Label>
        <View
          style={{
            minHeight: 164,
            borderRadius: radii.card,
            backgroundColor: "#F1F3F5",
            paddingHorizontal: 16,
            paddingTop: 14,
          }}
        >
          <AppTextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={"Précisez les instructions particulières ou \nle contenu..."}
            placeholderTextColor="#A0A5AE"
            multiline
            style={typography.bodyRegular}
          />
        </View>
      </View>

      {/* Montant */}
      <View style={{ marginBottom: 20 }}>
        <Label>Montant</Label>
        <View
          style={{
            minHeight: 56,
            borderRadius: radii.card,
            backgroundColor: "#F1F3F5",
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <AppTextInput
            value={amountDueText}
            onChangeText={setAmountDueText}
            placeholder="0.00"
            placeholderTextColor="#A0A5AE"
            keyboardType="decimal-pad"
            style={[typography.bodyRegular, { flex: 1 }]}
          />
          <AppText variant="dense" style={{ ...typography.link, marginLeft: 10 }} numberOfLines={1}>
            XAF
          </AppText>
        </View>
      </View>

      {/* Photo */}
      <View style={{ marginBottom: 24 }}>
        <Label>Photo de l&apos;article</Label>
        <Pressable
          disabled
          style={{
            minHeight: 160,
            paddingVertical: 14,
            borderRadius: radii.card,
            backgroundColor: "#F1F3F5",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#D1D5DB",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.7,
          }}
        >
          <AppText style={{ ...typography.subtitle, fontSize: 14 }} numberOfLines={2} ellipsizeMode="tail">
            Ajouter une photo
          </AppText>
        </Pressable>
        <Helper>Indisponible</Helper>
      </View>

      {error ? (
        <AppText style={{ color: "#D32F2F", fontFamily: fonts.bodySemi, marginBottom: 12 }}>
          {error}
        </AppText>
      ) : null}

      {/* CTA */}
      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={{
          minHeight: 60,
          borderRadius: radii.pill,
          backgroundColor: canSubmit ? colors.primary : "#90BFD8",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          paddingVertical: 14,
        }}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <AppText style={{ ...typography.buttonTextInverse, marginRight: 10 }} numberOfLines={2} ellipsizeMode="tail">
              Envoyer ma demande
            </AppText>
            <ArrowRight size={18} color={colors.white} />
          </>
        )}
      </Pressable>
    </ScreenLayout>
  );
}

