import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, RefreshControl, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import EmptyStateCard from "../../components/EmptyStateCard";
import ScreenLayout from "../../components/ScreenLayout";
import TransactionCard, { type TransactionCardItem } from "../../components/TransactionCard";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listTransactions } from "@/lib/api/transactions";
import {
  filterCardItemsByStatus,
  transactionsToCardItems,
  type TransactionStatusFilter,
} from "@/lib/api/transactionUi";
import { shouldRefreshLivraisonList } from "@/lib/push/notificationRouting";
import { usePushRefresh } from "@/lib/push/usePushRefresh";

function Chip({ label, active }: { label: TransactionStatusFilter; active?: boolean }) {
  return (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: active ? colors.primary : "#E9E9EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        variant="dense"
        style={{
          ...(typography.bodyRegular as object),
          fontFamily: fonts.bodySemi,
          color: active ? colors.white : colors.text,
        }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

export default function LivraisonScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [active, setActive] = useState<TransactionStatusFilter>(() => {
    if (filter === "En cours") return "En cours";
    if (filter === "Livré") return "Livré";
    if (filter === "Annulé") return "Annulé";
    return "Tout";
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<TransactionCardItem[]>([]);

  const loadTransactions = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      const data = await listTransactions();
      setAllOrders(transactionsToCardItems(data));
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTransactions("initial");
    }, [loadTransactions]),
  );

  const shouldRefreshFromPush = useCallback((payload: Parameters<typeof shouldRefreshLivraisonList>[0]) => {
    return shouldRefreshLivraisonList(payload);
  }, []);

  usePushRefresh(
    shouldRefreshFromPush,
    useCallback(() => {
      void loadTransactions("refresh");
    }, [loadTransactions]),
  );

  const orders = useMemo(() => filterCardItemsByStatus(allOrders, active), [active, allOrders]);
  const hasAnyOrders = allOrders.length > 0;
  const isFilteredEmpty = hasAnyOrders && orders.length === 0;

  return (
    <ScreenLayout
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadTransactions("refresh");
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ),
      }}
      header={
        <View style={{ paddingBottom: 10 }}>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Mes Courses
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Consultez toutes vos courses
          </AppText>
        </View>
      }
    >
      {hasAnyOrders ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: spacing.sectionGap / 2 }}
          style={{ marginBottom: 0, flexGrow: 0 }}
        >
          {(["Tout", "En cours", "Livré", "Annulé"] as const).map((label) => (
            <Pressable key={label} onPress={() => setActive(label)}>
              <Chip label={label} active={active === label} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {hasAnyOrders ? (
        <View style={{ marginBottom: spacing.sectionGap / 2 }}>
          <Pressable
            onPress={() => router.push("/ma-demande-livraison")}
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
              Demander une nouvelle livraison
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View style={{ marginTop: 6, borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            Chargement…
          </AppText>
        </View>
      ) : error ? (
        <View style={{ marginTop: 6, borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            Impossible de charger vos livraisons
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
            {error}
          </AppText>
          <Pressable
            onPress={() => {
              void loadTransactions("initial");
            }}
            style={{
              marginTop: 14,
              minHeight: 56,
              paddingVertical: 14,
              borderRadius: radii.pill,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText style={typography.buttonTextInverse} numberOfLines={1}>
              Réessayer
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {isFilteredEmpty ? (
        <View style={{ marginTop: 6, borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            Aucune course « {active} »
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
            Essayez un autre filtre ou consultez toutes vos courses.
          </AppText>
          <Pressable
            onPress={() => setActive("Tout")}
            style={{ marginTop: 14, alignSelf: "flex-start" }}
            hitSlop={10}
          >
            <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
              Voir tout
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && orders.length === 0 && !isFilteredEmpty ? (
        <EmptyStateCard
          label={
            active === "En cours"
              ? "EN COURS"
              : active === "Livré"
                ? "LIVRÉ"
                : active === "Annulé"
                  ? "ANNULÉ"
                  : "BIENVENUE"
          }
          iconName="solar:delivery-bold-duotone"
          title={
            active === "En cours"
              ? "Aucune livraison en cours"
              : active === "Livré"
                ? "Aucune livraison livrée pour le moment"
                : active === "Annulé"
                  ? "Aucune livraison annulée"
                  : "Vous n’avez pas encore de livraison"
          }
          subtitle={active === "Tout" ? "Créez votre première livraison ou expédition en 30 secondes." : undefined}
          ctas={
            active === "Tout" || active === "En cours"
              ? [
                  { label: "Livraison", onPress: () => router.push("/ma-demande-livraison") },
                  {
                    label: "Expédition",
                    variant: "white",
                    onPress: () => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } }),
                  },
                ]
              : []
          }
        />
      ) : orders.length > 0 ? (
        <View style={{ gap: 24, paddingBottom: 8 }}>
          {orders.map((o) => (
            <TransactionCard key={o.id} item={o} />
          ))}
        </View>
      ) : null}
    </ScreenLayout>
  );
}
