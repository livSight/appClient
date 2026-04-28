import { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import PillButton from "../../components/PillButton";
import AppText from "../../components/AppText";
import HomeTopBar from "../../components/HomeTopBar";
import LivraisonCard, { type LivraisonOrder } from "../../components/LivraisonCard";
import PromoBanner from "../../components/PromoBanner";
import CategoryGrid, { type CategoryItem } from "../../components/CategoryGrid";
import { listTransactionsForDevUser, type Transaction } from "@/lib/api/deliveries";
 
const CATEGORIES: CategoryItem[] = [
  { title: "Livraison", iconName: "solar:delivery-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Expédition", iconName: "solar:rocket-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } }) },
  { title: "Course", iconName: "solar:routing-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Ramassage", iconName: "solar:hand-shake-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-livraison", params: { mode: "pickup", quartier: "" } }) },
];

function formatDateLabel(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function mapTxnStatusToUi(status?: string): "En cours" | "Livré" | "Annulé" {
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
  const destStreet = typeof tx.destination?.street === "string" ? tx.destination.street : String((tx as any).destination_street ?? "");
  const quartier = destStreet.split("—")[0]?.trim() || destStreet.trim() || "—";
  const amount = Number(tx.amount ?? 0);

  return {
    id,
    ref: tx.transactionReference ? `#${tx.transactionReference}` : id ? `#TR-${id}` : "#—",
    title,
    quartier,
    dateLabel: formatDateLabel(tx.created_at),
    status: mapTxnStatusToUi(tx.status),
    amountLabel: moneyLabel(amount),
    paymentLabel: amount > 0 ? "ESPÈCES" : "—",
  };
}

export default function AccueilScreen() {
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
        setTxns([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const recentUi = useMemo(() => {
    const sorted = [...txns].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
    const first = sorted[0];
    return first ? mapTransactionToOrder(first) : null;
  }, [txns]);
  const hasRecent = Boolean(recentUi?.id);
  const agencyStatus = useMemo<"online" | "offline">(() => (error ? "offline" : "online"), [error]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 20 }}>
          <HomeTopBar
            locationLabel="Yaoundé, Cameroun"
            agencyStatus={agencyStatus}
            onProfilePress={() => router.push("/profile")}
          />
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Bonjour Alex
          </AppText>
        </View>
      }
    >

      {agencyStatus === "offline" ? (
        <View style={{ marginBottom: spacing.sectionGap, borderRadius: radii.card, backgroundColor: "rgba(211,47,47,0.10)", padding: 16 }}>
          <AppText style={{ ...typography.bodyRegular, fontSize: 14, lineHeight: 20, color: "#7A1B1B" }} numberOfLines={3}>
            Agence hors ligne — la prise en charge peut être plus lente.
          </AppText>
        </View>
      ) : null}

      {/* Category Grid */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <SectionHeader title="De quels services avez-vous besoin aujourd'hui ?" style={{ marginBottom: 16 }} />
        <CategoryGrid items={CATEGORIES} />
      </View>

      {/* Recent Deliveries */}
      <View style={{ marginBottom: spacing.sectionGap }}>
        <SectionHeader
          title="Dernière commande"
          linkLabel="Voir tout"
          onLinkPress={() => router.push("/(tabs)/livraison")}
          style={{ marginBottom: 16 }}
        />

        {loading ? (
          <View style={{ borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
            <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
              Chargement…
            </AppText>
          </View>
        ) : error ? (
          <View style={{ borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
            <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
              Impossible de charger vos commandes
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
              style={{ marginTop: 14, alignSelf: "flex-start" }}
              hitSlop={10}
            >
              <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : hasRecent && recentUi ? (
          <LivraisonCard order={recentUi} />
        ) : (
          <View style={{ borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
            <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
              Aucune commande en cours
            </AppText>
            <AppText style={{ ...typography.subtitle, marginTop: 6 }}>
              Créez votre première livraison en 30 secondes.
            </AppText>
            <View style={{ marginTop: 14, flexDirection: "row", gap: 12, alignItems: "center" }}>
              <PillButton label="Créer une livraison" onPress={() => router.push("/ma-demande-livraison")} />
              <PillButton
                label="Créer une expédition"
                variant="white"
                onPress={() => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } })}
              />
            </View>
          </View>
        )}
      </View>

      {/* Promo Banner */}
      <PromoBanner />
    </ScreenLayout>
  );
}
