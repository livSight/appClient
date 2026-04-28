import { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import LivraisonCard, { type LivraisonOrder } from "../../components/LivraisonCard";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listTransactionsForDevUser, type Transaction } from "@/lib/api/deliveries";

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

function mapTxnStatusToUi(status?: string): Status {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "delivered") return "Livré";
  if (s === "failed" || s === "cancelled") return "Annulé";
  return "En cours";
}

function moneyLabel(amount?: number): string {
  const n = Number.isFinite(Number(amount)) ? Math.max(0, Math.round(Number(amount))) : 0;
  return `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA`;
}

function mapTransactionToOrder(tx: Transaction): LivraisonOrder {
  const id = String(tx.id ?? "");
  const qty = Number.isFinite(Number(tx.quantity)) ? Math.max(1, Math.floor(Number(tx.quantity))) : 1;
  const titleBase = String(tx.package_name ?? "Colis");
  const title = qty > 1 && !titleBase.includes("x") ? `${titleBase} x${qty}` : titleBase;
  const destStreet = typeof tx.destination?.street === "string" ? tx.destination.street : String(tx.destination_street ?? "");
  const quartier = destStreet.split("—")[0]?.trim() || destStreet.trim() || "—";
  const statusUi = mapTxnStatusToUi(tx.status);
  const amount = Number(tx.amount ?? 0);

  return {
    id,
    ref: tx.transactionReference ? `#${tx.transactionReference}` : id ? `#TR-${id}` : "#—",
    title,
    quartier,
    dateLabel: formatDateLabel(tx.created_at),
    status: statusUi === "En cours" ? "En cours" : statusUi === "Livré" ? "Livré" : "Annulé",
    amountLabel: moneyLabel(amount),
    paymentLabel: amount > 0 ? "ESPÈCES" : "—",
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
            Mes Livraisons
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Consultez toutes vos livraisons
          </AppText>
        </View>
      }
    >
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
        <View style={{ marginTop: 6, borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            {active === "En cours"
              ? "Aucune livraison en cours"
              : active === "Livré"
                ? "Aucune livraison livrée pour le moment"
                : active === "Annulé"
                  ? "Aucune livraison annulée"
                  : "Vous n'avez pas encore de livraison"}
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }}>
            {active === "Tout" ? "Créez votre première livraison en 30 secondes." : ""}
          </AppText>
          {active === "En cours" || active === "Tout" ? (
            <Pressable
              onPress={() => router.push("/ma-demande-livraison")}
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
              <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
                {active === "Tout" ? "Créer votre première livraison" : "Demander une livraison"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 24, paddingBottom: 8 }}>
          {orders.map((o) => (
            <LivraisonCard key={o.id} order={o} />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}
