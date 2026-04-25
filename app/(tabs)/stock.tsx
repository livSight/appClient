import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SolarIcon from "../../components/SolarIcon";
import { card, row } from "../../theme/styles";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import AppText from "../../components/AppText";

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

const MOCK_ITEMS: StockItem[] = [
  { id: "s1", name: "Farine de blé", subtitle: "Sac 25kg", qty: 4 },
  { id: "s2", name: "Riz", subtitle: "5kg", qty: 2, low: true },
  { id: "s3", name: "Huile", subtitle: "1L", qty: 10 },
];

function QtyPill({
  value,
  low,
  onDec,
  onInc,
}: {
  value: number;
  low?: boolean;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <View
      style={{
        minHeight: 56,
        minWidth: 140,
        borderRadius: radii.pill,
        backgroundColor: "#F3F4F5",
        paddingHorizontal: 4,
        paddingVertical: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={onDec}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SolarIcon name="solar:minus-square-outline" size={24} color={colors.primary} />
      </Pressable>

      <View style={{ flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" }}>
        <AppText
          variant="dense"
          style={{ fontSize: 16, lineHeight: 20, fontFamily: fonts.bodyBold, color: low ? "#BA1A1A" : colors.text }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </AppText>
      </View>

      <Pressable
        onPress={onInc}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SolarIcon name="solar:add-square-outline" size={24} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function ProductCard({
  item,
  onDec,
  onInc,
  onRemove,
}: {
  item: StockItem;
  onDec: () => void;
  onInc: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={[card.base, { paddingHorizontal: 32, paddingVertical: 24, minHeight: 160 }]}>
      <View style={{ ...row.spaceBetween, alignItems: "center" }}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <AppText style={{ fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            {item.name}
          </AppText>
          <AppText
            style={{ ...typography.subtitle, fontSize: 14, lineHeight: 20, marginTop: 4 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.subtitle}
          </AppText>
          <View style={{ marginTop: 16 }}>
            <QtyPill value={item.qty} low={item.low} onDec={onDec} onInc={onInc} />
          </View>
        </View>

        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <SolarIcon name="solar:trash-bin-trash-outline" size={24} color={"rgba(25,28,29,0.35)"} />
        </Pressable>
      </View>
    </View>
  );
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
      // UI-only: load from mock items.
      setItems(MOCK_ITEMS.map((it) => ({ ...it, low: it.qty <= 2 })));
      initialSnapshotRef.current = toSnapshot(MOCK_ITEMS);
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
      load();
      return () => {};
    }, []),
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
          setItems((prev) => prev.filter((it) => it.id !== id));
        },
      },
    ]);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      // UI-only: treat current state as saved locally.
      initialSnapshotRef.current = toSnapshot(items);
      await hapticSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l&apos;enregistrement");
    } finally {
      setSaving(false);
    }
  }

  // Accept new item from /ajouter-au-stock (UI-only navigation contract).
  useEffect(() => {
    if (!addedName) return;
    const qty = Math.max(0, Number(addedQty ?? "0") || 0);
    setItems((prev) => [{ id: `tmp:${Date.now()}`, name: addedName, subtitle: addedSubtitle ?? "", qty }, ...prev]);
  }, [addedName, addedQty, addedSubtitle]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          paddingTop: insets.top + spacing.screenPaddingX,
          paddingHorizontal: spacing.screenPaddingX,
          paddingBottom: 10,
          backgroundColor: colors.bg,
        }}
      >
        <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
          Mon Stock
        </AppText>
        <AppText style={[typography.subtitle, { marginTop: 4 }]}>
          Gérez vos produits
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPaddingX,
          paddingBottom: dirty ? insets.bottom + 220 : 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
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
        </View>

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
        ) : (
          <View style={{ marginTop: 32, gap: 32 }}>
            {items.map((it) => (
              <ProductCard
                key={it.id}
                item={{ ...it, low: it.qty <= 2 }}
                onDec={() => dec(it.id)}
                onInc={() => inc(it.id)}
                onRemove={() => remove(it.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

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

