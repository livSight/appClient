import { useCallback, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import ScreenLayout from "../../components/ScreenLayout";
import SectionHeader from "../../components/SectionHeader";
import AppText from "../../components/AppText";
import HomeTopBar from "../../components/HomeTopBar";
import TransactionCard from "../../components/TransactionCard";
import PromoBanner from "../../components/PromoBanner";
import CategoryGrid, { type CategoryItem } from "../../components/CategoryGrid";
import { listTransactions } from "@/lib/api/transactions";
import {
  mapTransactionToCardItem,
  sortTransactionsForDisplay,
} from "@/lib/api/transactionUi";
import { getCurrentUser, type User } from "@/lib/api/users";
const CATEGORIES: CategoryItem[] = [
  { title: "Livraison", iconName: "solar:delivery-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Expédition", iconName: "solar:rocket-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-expedition", params: { quartier: "" } }) },
  { title: "Course", iconName: "solar:routing-bold-duotone", onPress: () => router.push("/ma-demande-livraison") },
  { title: "Ramassage", iconName: "solar:hand-shake-bold-duotone", onPress: () => router.push({ pathname: "/ma-demande-livraison", params: { mode: "pickup", quartier: "" } }) },
];

export default function AccueilScreen() {
  const [txns, setTxns] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listTransactions();
      setTxns(data);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
      setTxns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTransactions();
    }, [loadTransactions]),
  );

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const data = await getCurrentUser();
          if (!mounted) return;
          setUser(data);
        } catch {
          if (!mounted) return;
          setUser(null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, []),
  );

  const displayName = useMemo(() => {
    const first = String(user?.first_name ?? "").trim();
    const fullName = String(user?.name ?? "").trim();
    return first || fullName || "—";
  }, [user?.first_name, user?.name]);

  const initials = useMemo(() => {
    const first = String(user?.first_name ?? "").trim();
    const last = String((user as any)?.last_name ?? "").trim();
    if (first || last) {
      const a = first ? first[0] : "";
      const b = last ? last[0] : "";
      const s = `${a}${b}`.trim();
      return s.length ? s : "A";
    }
    const name = String(user?.name ?? "").trim();
    if (!name) return "A";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const s = `${a}${b}`.trim();
    return s.length ? s : "A";
  }, [user?.first_name, (user as any)?.last_name, user?.name]);

  const recentUi = useMemo(() => {
    const sorted = sortTransactionsForDisplay(txns);
    const first = sorted[0];
    return first ? mapTransactionToCardItem(first) : null;
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
            initials={initials}
          />
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            {displayName !== "—" ? `Bonjour ${displayName}` : "Bonjour"}
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
        <CategoryGrid items={CATEGORIES} variant={hasRecent ? "row" : "grid"} />
      </View>

      {/* Recent Deliveries */}
      {loading || error || hasRecent ? (
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
                  void loadTransactions();
                }}
                style={{ marginTop: 14, alignSelf: "flex-start" }}
                hitSlop={10}
              >
                <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                  Réessayer
                </AppText>
              </Pressable>
            </View>
          ) : recentUi ? (
            <TransactionCard item={recentUi} />
          ) : null}
        </View>
      ) : null}

      {/* Promo Banner */}
      <PromoBanner />
    </ScreenLayout>
  );
}
