import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { card, row } from "../../theme/styles";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import {
  createVendorStockItem,
  deleteVendorStockItem,
  listVendorStockItems,
  patchVendorStockItem,
  type StockItem as ApiStockItem,
} from "@/lib/api/stock";

type StockItem = {
  id: string;
  serverId?: number;
  name: string;
  subtitle: string;
  qty: number;
  low?: boolean;
};

function toUi(it: ApiStockItem): StockItem {
  return {
    id: String(it.id),
    serverId: it.id,
    name: it.name,
    subtitle: it.subtitle ?? "",
    qty: it.quantity ?? 0,
    low: it.quantity <= 2,
  };
}

function isTempId(id: string) {
  return id.startsWith("tmp:");
}

function toSnapshot(items: StockItem[]) {
  return JSON.stringify(
    [...items]
      .map((it) => ({ serverId: it.serverId ?? null, name: it.name, subtitle: it.subtitle, qty: it.qty }))
      .sort((a, b) => String(a.serverId ?? a.name).localeCompare(String(b.serverId ?? b.name))),
  );
}

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
        height: 48,
        width: 140,
        borderRadius: radii.pill,
        backgroundColor: "#F3F4F5",
        paddingHorizontal: 4,
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
        <Minus size={18} color={colors.primary} />
      </Pressable>

      <Text style={{ fontSize: 18, fontWeight: "800", color: low ? "#BA1A1A" : colors.text }}>
        {value}
      </Text>

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
        <Plus size={18} color={colors.primary} />
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
    <View style={[card.base, { paddingHorizontal: 32, paddingVertical: 24, height: 160 }]}>
      <View style={{ ...row.spaceBetween, alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{item.name}</Text>
          <Text style={{ ...typography.subtitle, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
            {item.subtitle}
          </Text>
          <View style={{ marginTop: 16 }}>
            <QtyPill value={item.qty} low={item.low} onDec={onDec} onInc={onInc} />
          </View>
        </View>

        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <Trash2 size={18} color={"rgba(25,28,29,0.35)"} />
        </Pressable>
      </View>
    </View>
  );
}

export default function StockScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialSnapshotRef = useRef<string>(toSnapshot(items));
  const initialQtyByServerIdRef = useRef<Map<number, number>>(new Map());
  const deletedServerIdsRef = useRef<Set<number>>(new Set());

  const dirty = useMemo(
    () => toSnapshot(items) !== initialSnapshotRef.current || deletedServerIdsRef.current.size > 0,
    [items],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listVendorStockItems();
      const ui = data.map(toUi);
      setItems(ui);
      deletedServerIdsRef.current = new Set();
      initialQtyByServerIdRef.current = new Map(ui.flatMap((it) => (it.serverId ? [[it.serverId, it.qty]] : [])));
      initialSnapshotRef.current = toSnapshot(ui);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  function dec(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty - 1) } : it)),
    );
  }

  function inc(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }

  function remove(id: string) {
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);
      if (found?.serverId) deletedServerIdsRef.current.add(found.serverId);
      return prev.filter((it) => it.id !== id);
    });
  }

  function add() {
    setItems((prev) => [
      ...prev,
      { id: `tmp:${Date.now()}`, name: "Nouveau produit", subtitle: "À compléter", qty: 0, low: true },
    ]);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      // 1) Delete removed server items
      const deleted = [...deletedServerIdsRef.current];

      // 2) Create new items (local temp ids)
      const temps = items.filter((it) => isTempId(it.id));

      // 3) Patch quantities that changed since last load/save
      const changed = items
        .filter((it) => it.serverId && !isTempId(it.id))
        .filter((it) => {
          const prevQty = initialQtyByServerIdRef.current.get(it.serverId!);
          return typeof prevQty === "number" && prevQty !== it.qty;
        });

      await Promise.all([
        ...deleted.map((id) => deleteVendorStockItem(id)),
        ...temps.map((it) =>
          createVendorStockItem({
            name: it.name,
            subtitle: it.subtitle?.trim() ? it.subtitle.trim() : undefined,
            quantity: it.qty,
          }),
        ),
        ...changed.map((it) => patchVendorStockItem(it.serverId!, { quantity: it.qty })),
      ]);

      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l&apos;enregistrement");
    } finally {
      setSaving(false);
    }
  }

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
        <Text style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]}>Mon Stock</Text>
        <Text style={[typography.subtitle, { marginTop: 4 }]}>Gérez vos produits</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.screenPaddingX,
          paddingBottom: dirty ? 160 : 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Pressable
            onPress={() => router.push("/ajouter-au-stock")}
            style={{
              height: 56,
              borderRadius: radii.pill,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={typography.buttonTextInverse}>Ajouter un produit à votre stock</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 28, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: "#D32F2F", fontWeight: "600", marginBottom: 12 }}>{error}</Text>
            <Pressable
              onPress={load}
              style={{
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                alignSelf: "flex-start",
              }}
            >
              <Text style={typography.buttonTextInverse}>Réessayer</Text>
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
            paddingBottom: 18,
            paddingTop: 10,
            backgroundColor: "rgba(248,249,250,0.92)",
          }}
        >
          <Pressable
            onPress={save}
            disabled={saving}
            style={{
              height: 68,
              borderRadius: 24,
              backgroundColor: saving ? "rgba(48,144,192,0.65)" : colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.white }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

