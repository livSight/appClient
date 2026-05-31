import { useCallback, useEffect, useState } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import EmptyStateCard from "../../components/EmptyStateCard";
import ScreenLayout from "../../components/ScreenLayout";
import { colors, fonts, radii, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listPackages, makeClientId, type Package } from "@/lib/api/packages";
import StockProductCard, { type StockProductCardItem } from "@/components/StockProductCard";

type Row = StockProductCardItem;

function toRows(packages: Package[]): Row[] {
  return packages
    .map((p) => {
      const name = String(p?.package_name ?? "").trim();
      if (!name) return null;
      const qty = Number.isFinite(Number(p?.quantity)) ? Math.max(0, Math.floor(Number(p.quantity))) : 0;
      return {
        id: makeClientId(p),
        name,
        subtitle: String(p?.description ?? ""),
        qty,
        low: qty <= 2,
      } satisfies Row;
    })
    .filter(Boolean) as Row[];
}

export default function StockScreen() {
  const { addedName } = useLocalSearchParams<{ addedName?: string }>();
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const packages = await listPackages();
      setItems(toRows(packages));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {};
    }, [load]),
  );

  useEffect(() => {
    if (!addedName) return;
    void load();
  }, [addedName, load]);

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
              <StockProductCard key={it.id} item={it} />
            ))}
          </View>
        )}
      </ScreenLayout>
    </View>
  );
}
