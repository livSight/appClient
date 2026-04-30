import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyStateCard from "../../components/EmptyStateCard";
import ScreenLayout from "../../components/ScreenLayout";
import SolarIcon from "../../components/SolarIcon";
import { card, row } from "../../theme/styles";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import AppText from "../../components/AppText";
import { deleteStockItem, listStockItems, updateStockItemPut } from "@/lib/api/stock";
import StockProductCard, { type StockProductCardItem } from "@/components/StockProductCard";

type StockItem = {
  id: string;
  name: string;
  subtitle: string;
  qty: number;
  low?: boolean;
};

function toSnapshot(items: StockItem[]) {
  return JSON.stringify(
    [...items]
      .map((it) => ({ name: it.name, subtitle: it.subtitle, qty: it.qty }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

function asId(value: unknown): string {
  if (typeof value === "string" && value.length) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function normalizeServerItems(items: any[]): StockItem[] {
  return items
    .map((it) => ({
      id: asId(it?.id),
      name: String(it?.name ?? ""),
      subtitle: String(it?.subtitle ?? ""),
      qty: Number.isFinite(Number(it?.qty)) ? Number(it.qty) : 0,
    }))
    .filter((it) => it.id && it.name);
}

export default function StockScreen() {
  const { addedName, addedQty, addedSubtitle } = useLocalSearchParams<{
    addedName?: string;
    addedQty?: string;
    addedSubtitle?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialSnapshotRef = useRef<string>(toSnapshot(items));

  const dirty = useMemo(
    () => toSnapshot(items) !== initialSnapshotRef.current,
    [items],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const serverItems = await listStockItems();
      const next = normalizeServerItems(serverItems).map((it) => ({ ...it, low: it.qty <= 2 }));
      setItems(next);
      initialSnapshotRef.current = toSnapshot(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (addedName) return; // item ajouté via params — l'useEffect dédié s'en charge
      load();
      return () => {};
    }, [addedName]),
  );

  function dec(id: string) {
    void hapticLight();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it)),
    );
  }

  function inc(id: string) {
    void hapticLight();
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }

  function remove(id: string) {
    Alert.alert("Supprimer ce produit ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await hapticSuccess();
          try {
            await deleteStockItem(id);
            setItems((prev) => {
              const next = prev.filter((it) => it.id !== id);
              initialSnapshotRef.current = toSnapshot(next);
              return next;
            });
          } catch (e: any) {
            Alert.alert("Erreur", String(e?.message ?? e ?? "Impossible de supprimer le produit."));
          }
        },
      },
    ]);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      // Persist changes to API (PUT full resource).
      const ops = items.map((it) =>
        updateStockItemPut(it.id, {
          name: it.name,
          subtitle: it.subtitle,
          qty: it.qty,
        }),
      );
      await Promise.all(ops);
      initialSnapshotRef.current = toSnapshot(items);
      await hapticSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l&apos;enregistrement");
    } finally {
      setSaving(false);
    }
  }

  // Accept new item from /ajouter-au-stock. Backend already created it → just refresh.
  useEffect(() => {
    if (!addedName) return;
    void load();
  }, [addedName, addedQty, addedSubtitle]);

  return (
    <View style={{ flex: 1 }}>
      <ScreenLayout
        header={
          <View style={{ paddingBottom: 10 }}>
            <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
              Mon Stock
            </AppText>
            <AppText style={[typography.subtitle, { marginTop: 4 }]}>
              Gérez vos produits
            </AppText>
          </View>
        }
      >
        {!loading && !error && items.length > 0 ? (
          <Pressable
            onPress={() => router.push("/ajouter-au-stock")}
            style={{
              minHeight: 56,
              paddingVertical: 14,
              borderRadius: radii.pill,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
              Ajouter un produit à votre stock
            </AppText>
          </Pressable>
        ) : null}

        {loading ? (
          <View style={{ paddingVertical: 28, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 16 }}>
            <AppText style={{ color: "#D32F2F", fontFamily: fonts.bodySemi, marginBottom: 12 }}>
              {error}
            </AppText>
            <Pressable
              onPress={load}
              style={{
                minHeight: 44,
                paddingVertical: 10,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                alignSelf: "flex-start",
              }}
            >
              <AppText style={typography.buttonTextInverse} numberOfLines={1}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <EmptyStateCard
            label="BIENVENUE"
            iconName="solar:box-bold-duotone"
            title="Votre stock est vide"
            subtitle="Ajoutez vos produits pour les retrouver lors d’une livraison ou d’une expédition."
            ctas={[
              { label: "Ajouter un produit", onPress: () => router.push("/ajouter-au-stock") },
            ]}
          />
        ) : (
          <View style={{ marginTop: 32, gap: 32 }}>
            {items.map((it) => (
              <StockProductCard
                key={it.id}
                item={{ ...it, low: it.qty <= 2 } satisfies StockProductCardItem}
              />
            ))}
          </View>
        )}

        {dirty ? <View style={{ height: insets.bottom + 110 }} /> : null}
      </ScreenLayout>

      {dirty ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 18,
            paddingBottom: insets.bottom + 18,
            paddingTop: 10,
            backgroundColor: "rgba(248,249,250,0.92)",
          }}
        >
          <Pressable
            onPress={save}
            disabled={saving}
            style={{
              minHeight: 68,
              paddingVertical: 16,
              borderRadius: 24,
              backgroundColor: saving ? "rgba(14,165,233,0.65)" : colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText style={{ fontSize: 18, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

