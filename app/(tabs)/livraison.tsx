import { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import EmptyStateCard from "../../components/EmptyStateCard";
import ScreenLayout from "../../components/ScreenLayout";
import TransactionCard, { type TransactionCardItem } from "../../components/TransactionCard";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listTransactionsForDevUser, type Transaction } from "@/lib/api/deliveries";
import { getTransactionNavigationId, mapTxnStatusToUi as mapTxnStatusBucket, txnModeLabelFromTransaction } from "@/lib/api/transactionMapping";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

function formatDateLabel(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function moneyLabel(amount?: number): string {
  const n = Number.isFinite(Number(amount)) ? Math.max(0, Math.round(Number(amount))) : 0;
  return `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA`;
}

function txnTypeLabel(type?: string): string {
  const t = String(type ?? "").trim().toLowerCase();
  if (t === "expedition") return "Expédition";
  if (t === "delivery" || t === "livraison") return "Livraison";
  if (t === "pickup") return "Livraison";
  return t.length ? t : "";
}

function txnModeLabel(tx: Transaction): string {
  return txnModeLabelFromTransaction(tx);
}

function mapTransactionToOrder(tx: Transaction): TransactionCardItem {
  const id = getTransactionNavigationId(tx);
  const qty = Number.isFinite(Number(tx.quantity)) ? Math.max(1, Math.floor(Number(tx.quantity))) : 1;
  const titleBase = String(tx.package_name ?? "Colis");
  const title = qty > 1 && !titleBase.includes("x") ? `${titleBase} x${qty}` : titleBase;
  const destStreet = typeof tx.destination?.street === "string" ? tx.destination.street : String(tx.destination_street ?? "");
  const quartier = destStreet.split("—")[0]?.trim() || destStreet.trim() || "—";
  const statusUi = mapTxnStatusBucket(tx.status);
  const amount = Number(tx.amount ?? 0);

  return {
    id,
    ref: tx.transactionReference ? `#${tx.transactionReference}` : id ? `#TR-${id}` : "#—",
    title,
    quartier,
    dateLabel: formatDateLabel(tx.created_at),
    status: statusUi,
    amountLabel: moneyLabel(amount),
    paymentLabel: amount > 0 ? "ESPÈCES" : "—",
    typeLabel: txnTypeLabel(tx.type),
    modeLabel: txnModeLabel(tx),
  };
}

function Chip({ label, active }: { label: Status; active?: boolean }) {
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
  const [active, setActive] = useState<Status>(() => {
    if (filter === "En cours") return "En cours";
    if (filter === "Livré") return "Livré";
    if (filter === "Annulé") return "Annulé";
    return "Tout";
  });

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listTransactionsForDevUser();
        if (!mounted) return;
        setTxns(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message ?? e ?? "Erreur"));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const allOrders = useMemo(() => txns.map(mapTransactionToOrder).filter((o) => o.id.length > 0), [txns]);
  const orders = useMemo(() => {
    if (active === "Tout") return allOrders;
    return allOrders.filter((o) => o.status === active);
  }, [active, allOrders]);

  return (
    <ScreenLayout
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
      {allOrders.length > 0 ? (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: spacing.sectionGap / 2 }}>
          <Pressable onPress={() => setActive("Tout")}>
            <Chip label="Tout" active={active === "Tout"} />
          </Pressable>
          <Pressable onPress={() => setActive("En cours")}>
            <Chip label="En cours" active={active === "En cours"} />
          </Pressable>
          <Pressable onPress={() => setActive("Livré")}>
            <Chip label="Livré" active={active === "Livré"} />
          </Pressable>
          <Pressable onPress={() => setActive("Annulé")}>
            <Chip label="Annulé" active={active === "Annulé"} />
          </Pressable>
        </View>
      ) : null}

      {orders.length > 0 ? (
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

      {loading ? (
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
              setLoading(true);
              setError(null);
              void (async () => {
                try {
                  const data = await listTransactionsForDevUser();
                  setTxns(data);
                } catch (e: any) {
                  setError(String(e?.message ?? e ?? "Erreur"));
                } finally {
                  setLoading(false);
                }
              })();
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

      {orders.length === 0 ? (
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
      ) : (
        <View style={{ gap: 24, paddingBottom: 8 }}>
          {orders.map((o) => (
            <TransactionCard key={o.id} item={o} />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}
