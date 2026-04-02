import { useMemo, useState } from "react";
import { ActivityIndicator, View, Text, Pressable, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronDown, ArrowRight } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, radii, typography } from "../theme/tokens";
import { createVendorDelivery } from "@/lib/api/vendor";

function Label({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function Helper({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280", marginTop: 6 }}>
      {children}
    </Text>
  );
}

function FieldContainer({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        height: 56,
        borderRadius: radii.card,
        backgroundColor: "#F1F3F5",
        paddingHorizontal: 16,
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
      await createVendorDelivery({
        items: items.trim(),
        phone: phone.trim(),
        amount_due: amountDue,
        quartier: quartier.trim(),
        ...(notes.trim().length ? { notes: notes.trim() } : {}),
      });
      router.push("/confirmee");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", height: 44, marginBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Livraison</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Text style={{ ...typography.link, letterSpacing: 1.2, marginBottom: 6 }}>
        DÉTAILS DE L&apos;ENVOI
      </Text>
      <Text style={{ ...typography.screenTitle, fontSize: 32, lineHeight: 36 }}>
        Nouvelle demande
      </Text>
      <Text style={{ ...typography.subtitle, marginTop: 10, marginBottom: 24 }}>
        Remplissez les informations ci-dessous pour{"\n"}initier votre livraison.
      </Text>

      {/* Quartier */}
      <View style={{ marginBottom: 20 }}>
        <Label>Quartier</Label>
        <FieldContainer>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {quartier || "—"}
          </Text>
        </FieldContainer>
        {!quartier ? <Helper>Zone requise. Retournez sélectionner une zone.</Helper> : null}
      </View>

      {/* Nom */}
      <View style={{ marginBottom: 20 }}>
        <Label>Nom</Label>
        <FieldContainer>
          <TextInput
            value={items}
            onChangeText={setItems}
            placeholder="Ex: Panier de légumes bio"
            placeholderTextColor="#A0A5AE"
            style={{ color: colors.text, fontSize: 14 }}
          />
        </FieldContainer>
      </View>

      {/* Numero */}
      <View style={{ marginBottom: 20 }}>
        <Label>Numero</Label>
        <FieldContainer>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="6XXXXXX"
            placeholderTextColor="#A0A5AE"
            keyboardType="phone-pad"
            style={{ color: colors.text, fontSize: 14 }}
          />
        </FieldContainer>
      </View>

      {/* Product selection */}
      <View style={{ marginBottom: 20 }}>
        <Label>Selectionner un produit</Label>
        <FieldContainer>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>
              Choisir dans le stock
            </Text>
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
            <Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>
              Choisir une agence
            </Text>
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
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={"Précisez les instructions particulières ou \nle contenu..."}
            placeholderTextColor="#A0A5AE"
            multiline
            style={{ color: colors.text, fontSize: 14 }}
          />
        </View>
      </View>

      {/* Montant */}
      <View style={{ marginBottom: 20 }}>
        <Label>Montant</Label>
        <View
          style={{
            height: 56,
            borderRadius: radii.card,
            backgroundColor: "#F1F3F5",
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            value={amountDueText}
            onChangeText={setAmountDueText}
            placeholder="0.00"
            placeholderTextColor="#A0A5AE"
            keyboardType="decimal-pad"
            style={{ flex: 1, color: colors.text, fontSize: 14 }}
          />
          <Text style={{ ...typography.link, marginLeft: 10 }}>XAF</Text>
        </View>
      </View>

      {/* Photo */}
      <View style={{ marginBottom: 24 }}>
        <Label>Photo de l&apos;article</Label>
        <Pressable
          disabled
          style={{
            height: 160,
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
          <Text style={{ ...typography.subtitle, fontSize: 14 }}>Ajouter une photo</Text>
        </Pressable>
        <Helper>Indisponible</Helper>
      </View>

      {error ? (
        <Text style={{ color: "#D32F2F", fontWeight: "600", marginBottom: 12 }}>{error}</Text>
      ) : null}

      {/* CTA */}
      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit}
        style={{
          height: 60,
          borderRadius: radii.pill,
          backgroundColor: canSubmit ? colors.primary : "#90BFD8",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={{ ...typography.buttonTextInverse, marginRight: 10 }}>
              Envoyer ma demande
            </Text>
            <ArrowRight size={18} color={colors.white} />
          </>
        )}
      </Pressable>
    </ScreenLayout>
  );
}

