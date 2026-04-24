import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Minus, Plus, PackagePlus } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import AppText from "../components/AppText";
import AppTextInput from "../components/AppTextInput";

function Label({ children }: { children: string }) {
  return (
    <AppText
      variant="dense"
      style={{
        fontSize: 11,
        fontFamily: fonts.bodyBold,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: "rgba(60,74,60,0.8)",
        marginBottom: 10,
      }}
      numberOfLines={2}
      ellipsizeMode="tail"
    >
      {children}
    </AppText>
  );
}

function QtyCounter({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View
      style={{
        minHeight: 56,
        borderRadius: radii.pill,
        backgroundColor: "#F3F4F5",
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
      }}
    >
      <Pressable
        onPress={async () => {
          await hapticLight();
          onDec();
        }}
        hitSlop={10}
        style={{
          width: 40,
          height: 40,
          borderRadius: 16,
          backgroundColor: "#E1E3E4",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Minus size={18} color={colors.primary} />
      </Pressable>

      <AppText style={{ fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
        {value}
      </AppText>

      <Pressable
        onPress={async () => {
          await hapticLight();
          onInc();
        }}
        hitSlop={10}
        style={{
          width: 40,
          height: 40,
          borderRadius: 16,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={18} color={colors.white} />
      </Pressable>
    </View>
  );
}

export default function AjouterAuStockScreen() {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => name.trim().length > 0 && !submitting, [name, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await hapticSuccess();
      // UI-only: pass new item to previous screen via params.
      router.replace({
        pathname: "/(tabs)/stock",
        params: {
          addedName: name.trim(),
          addedQty: String(qty),
          addedSubtitle: description.trim(),
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l&apos;ajout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      <AppText style={{ ...typography.screenTitle, fontSize: 30, lineHeight: 36 }} numberOfLines={3}>
        Ajouter un nouveau{"\n"}produit
      </AppText>
      <AppText style={{ ...typography.subtitle, marginTop: 10 }}>
        Complétez les détails pour gérer le stock de cet article
      </AppText>

      <View style={{ marginTop: 28 }}>
        <Label>Nom du produit</Label>
        <View
          style={{
            minHeight: 55,
            borderRadius: 24,
            backgroundColor: "#F3F4F5",
            paddingHorizontal: 20,
            justifyContent: "center",
            paddingVertical: 10,
          }}
        >
          <AppTextInput
            value={name}
            onChangeText={setName}
            placeholder="Farine de Blé"
            placeholderTextColor="rgba(60,74,60,0.35)"
            style={[typography.bodyRegular, { color: colors.text }]}
          />
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Label>Quantité initiale</Label>
        <QtyCounter value={qty} onDec={() => setQty((q) => Math.max(0, q - 1))} onInc={() => setQty((q) => q + 1)} />
      </View>

      <View style={{ marginTop: 28 }}>
        <Label>Description produit</Label>
        <View
          style={{
            minHeight: 104,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: "#F3F4F5",
            paddingHorizontal: 20,
            paddingTop: 14,
          }}
        >
          <AppTextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Courte description du produit"
            placeholderTextColor="rgba(60,74,60,0.40)"
            multiline
            style={[typography.bodyRegular, { color: colors.text }]}
          />
        </View>
      </View>

      {error ? (
        <AppText style={{ color: "#D32F2F", fontFamily: fonts.bodySemi, marginTop: 16 }}>{error}</AppText>
      ) : null}

      <View style={{ marginTop: 28 }}>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            minHeight: 68,
            borderRadius: 24,
            backgroundColor: canSubmit ? colors.primary : "rgba(48,144,192,0.45)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            paddingVertical: 14,
          }}
        >
          {submitting ? <ActivityIndicator color={colors.white} /> : <PackagePlus size={20} color={colors.white} />}
          <AppText style={{ fontSize: 18, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={2} ellipsizeMode="tail">
            Ajouter au stock
          </AppText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

