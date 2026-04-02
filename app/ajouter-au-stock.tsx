import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Minus, Plus, PackagePlus } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import { colors, radii, typography } from "../theme/tokens";
import { createVendorStockItem } from "@/lib/api/stock";

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: "rgba(60,74,60,0.8)",
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
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
        height: 56,
        borderRadius: radii.pill,
        backgroundColor: "#F3F4F5",
        paddingHorizontal: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={onDec}
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

      <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{value}</Text>

      <Pressable
        onPress={onInc}
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
      await createVendorStockItem({
        name: name.trim(),
        quantity: qty,
        ...(description.trim().length ? { subtitle: description.trim() } : {}),
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l&apos;ajout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenLayout>
      <Text style={{ ...typography.screenTitle, fontSize: 30, lineHeight: 36 }}>
        Ajouter un nouveau{"\n"}produit
      </Text>
      <Text style={{ ...typography.subtitle, marginTop: 10 }}>
        Complétez les détails pour gérer le stock de cet article
      </Text>

      <View style={{ marginTop: 28 }}>
        <Label>Nom du produit</Label>
        <View
          style={{
            height: 55,
            borderRadius: 24,
            backgroundColor: "#F3F4F5",
            paddingHorizontal: 20,
            justifyContent: "center",
          }}
        >
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Farine de Blé"
            placeholderTextColor="rgba(60,74,60,0.35)"
            style={{ fontSize: 16, color: colors.text, fontWeight: "500" }}
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
            height: 104,
            borderRadius: 12,
            backgroundColor: "#F3F4F5",
            paddingHorizontal: 20,
            paddingTop: 14,
          }}
        >
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Courte description du produit"
            placeholderTextColor="rgba(60,74,60,0.40)"
            multiline
            style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}
          />
        </View>
      </View>

      {error ? (
        <Text style={{ color: "#D32F2F", fontWeight: "600", marginTop: 16 }}>{error}</Text>
      ) : null}

      <View style={{ marginTop: 28 }}>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            height: 68,
            borderRadius: 24,
            backgroundColor: canSubmit ? colors.primary : "rgba(48,144,192,0.45)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
          }}
        >
          {submitting ? <ActivityIndicator color={colors.white} /> : <PackagePlus size={20} color={colors.white} />}
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.white }}>Ajouter au stock</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

