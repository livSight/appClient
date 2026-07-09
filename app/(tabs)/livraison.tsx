import { useCallback, useMemo, useState } from "react";
import { Modal, View, Pressable, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import EmptyStateCard from "../../components/EmptyStateCard";
import ScreenLayout from "../../components/ScreenLayout";
import SolarIcon from "../../components/SolarIcon";
import TransactionCard, { type TransactionCardItem } from "../../components/TransactionCard";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listTransactions } from "@/lib/api/transactions";
import {
  filterCardItemsByDate,
  filterCardItemsByStatus,
  transactionsToCardItems,
  TRANSACTION_DATE_FILTERS,
  type TransactionDateFilter,
  type TransactionStatusFilter,
} from "@/lib/api/transactionUi";
import { shouldRefreshLivraisonList } from "@/lib/push/notificationRouting";
import { usePushRefresh } from "@/lib/push/usePushRefresh";

function FilterDropdown<T extends string>({
  title,
  iconName,
  value,
  options,
  defaultValue,
  onSelect,
}: {
  title: string;
  iconName: string;
  value: T;
  options: readonly T[];
  defaultValue: T;
  onSelect: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = value !== defaultValue;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: radii.pill,
          backgroundColor: isActive ? "rgba(48,144,192,0.10)" : colors.white,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <SolarIcon name={iconName} size={18} color={isActive ? colors.primary : "rgba(60,74,60,0.55)"} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="dense"
            style={{
              fontSize: 13,
              lineHeight: 18,
              fontFamily: fonts.bodySemi,
              color: isActive ? colors.primary : colors.text,
            }}
            numberOfLines={1}
          >
            {value}
          </AppText>
        </View>
        <SolarIcon
          name="solar:alt-arrow-right-outline"
          size={16}
          color={isActive ? colors.primary : "rgba(60,74,60,0.45)"}
          style={{ transform: [{ rotate: "90deg" }] }}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "flex-end" }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 36,
            }}
          >
            <AppText
              variant="dense"
              style={{
                fontSize: 12,
                lineHeight: 16,
                fontFamily: fonts.bodyBold,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "rgba(60,74,60,0.55)",
                marginBottom: 6,
              }}
              numberOfLines={1}
            >
              {title}
            </AppText>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                style={{
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <AppText
                  style={{
                    fontSize: 15,
                    lineHeight: 22,
                    fontFamily: option === value ? fonts.bodyBold : fonts.bodyRegular,
                    color: option === value ? colors.primary : colors.text,
                  }}
                  numberOfLines={1}
                >
                  {option}
                </AppText>
                {option === value ? <SolarIcon name="solar:check-circle-bold" size={20} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  // Defaults to today's orders; "Toutes dates" is opt-in via the dropdown or the reset action.
  const [dateFilter, setDateFilter] = useState<TransactionDateFilter>("Aujourd'hui");

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

  const orders = useMemo(
    () => filterCardItemsByDate(filterCardItemsByStatus(allOrders, active), dateFilter),
    [active, allOrders, dateFilter],
  );
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
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
          <FilterDropdown<TransactionStatusFilter>
            title="Statut"
            iconName="solar:widget-5-outline"
            value={active}
            options={["Tout", "En cours", "Livré", "Annulé"] as const}
            defaultValue="Tout"
            onSelect={setActive}
          />
          <FilterDropdown<TransactionDateFilter>
            title="Période"
            iconName="solar:calendar-outline"
            value={dateFilter}
            options={TRANSACTION_DATE_FILTERS}
            defaultValue="Toutes dates"
            onSelect={setDateFilter}
          />
        </View>
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
            Aucune course trouvée
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
            {dateFilter === "Toutes dates"
              ? `Aucune course « ${active} ». Essayez un autre filtre.`
              : `Aucune course ne correspond à vos filtres (${active === "Tout" ? "toutes" : active.toLowerCase()} · ${dateFilter.toLowerCase()}).`}
          </AppText>
          <Pressable
            onPress={() => {
              setActive("Tout");
              setDateFilter("Toutes dates");
            }}
            style={{ marginTop: 14, alignSelf: "flex-start" }}
            hitSlop={10}
          >
            <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
              Réinitialiser les filtres
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
