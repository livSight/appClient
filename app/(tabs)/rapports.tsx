import { useCallback, useMemo, useState } from "react";
import { View, Pressable, RefreshControl, ActivityIndicator, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenLayout from "../../components/ScreenLayout";
import MetricCard from "../../components/MetricCard";
import SolarIcon from "../../components/SolarIcon";
import { colors, fonts, radii, shadows, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import { listTransactions } from "@/lib/api/transactions";
import { listPackages } from "@/lib/api/packages";
import ReportCustomDateRange from "@/components/ReportCustomDateRange";
import {
  aggregateReports,
  formatPeriodLabel,
  type ReportRange,
} from "@/lib/reports/aggregateReports";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

type StatusChip = {
  label: string;
  count: number;
  iconName: string;
  color: string;
};

function StatusChipRow({ chips }: { chips: StatusChip[] }) {
  const { width } = useWindowDimensions();
  const totalGap = spacing.gridColGap * (chips.length - 1);
  const cardWidth = (width - spacing.screenPaddingX * 2 - totalGap) / chips.length;

  return (
    <View style={{ flexDirection: "row", gap: spacing.gridColGap }}>
      {chips.map((chip) => (
        <View
          key={chip.label}
          style={{
            width: cardWidth,
            backgroundColor: colors.cardBg,
            borderRadius: radii.card,
            paddingVertical: 14,
            paddingHorizontal: 4,
            alignItems: "center",
            ...shadows.card,
          }}
        >
          <SolarIcon name={chip.iconName} size={22} color={chip.color} />
          <AppText
            style={{ marginTop: 6, fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }}
            numberOfLines={1}
          >
            {String(chip.count)}
          </AppText>
          <AppText
            variant="dense"
            style={{ marginTop: 2, fontSize: 10, lineHeight: 14, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.6)", textAlign: "center" }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {chip.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: ReportRange;
  onChange: (v: ReportRange) => void;
}) {
  const opts: ReportRange[] = ["Journalier", "Hebdo", "Mensuel", "Personnalisé"];
  return (
    <View
      style={{
        minHeight: 48,
        borderRadius: radii.pill,
        backgroundColor: "#F1F3F5",
        padding: 6,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 14,
      }}
    >
      {opts.map((o) => {
        const active = o === value;
        const label = o === "Personnalisé" ? "Perso." : o;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flexGrow: 1,
              flexBasis: o === "Personnalisé" ? "22%" : "23%",
              minWidth: 72,
              borderRadius: radii.pill,
              backgroundColor: active ? colors.white : "transparent",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
              paddingHorizontal: 4,
            }}
          >
            <AppText
              variant="dense"
              style={{ fontSize: 11, fontFamily: active ? fonts.bodyBold : fonts.bodySemi, color: colors.text }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function RapportsScreen() {
  const [range, setRange] = useState<ReportRange>("Journalier");
  const [customStart, setCustomStart] = useState(() => startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof listTransactions>>>([]);
  const [packages, setPackages] = useState<Awaited<ReturnType<typeof listPackages>>>([]);

  const loadReports = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      const [txns, pkgs] = await Promise.all([listTransactions(), listPackages()]);
      setTransactions(txns);
      setPackages(pkgs);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports("initial");
    }, [loadReports]),
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(range, new Date(), { start: customStart, end: customEnd }),
    [range, customStart, customEnd],
  );

  const report = useMemo(
    () =>
      aggregateReports({
        range,
        now: new Date(),
        customStart,
        customEnd,
        transactions,
        packages,
      }),
    [range, customStart, customEnd, transactions, packages],
  );

  const { formatted, serviceTypes, buckets } = report;

  const body = loading ? (
    <View style={{ paddingVertical: 48, alignItems: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText style={{ ...typography.subtitle, marginTop: 12 }} numberOfLines={2}>
        Chargement des rapports…
      </AppText>
    </View>
  ) : error ? (
    <View style={{ marginTop: 18, padding: 16, backgroundColor: colors.cardBg, borderRadius: radii.card }}>
      <AppText style={typography.bodyRegular} numberOfLines={4}>
        {error}
      </AppText>
      <Pressable
        onPress={() => void loadReports("initial")}
        style={{ marginTop: 12, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.pill, backgroundColor: colors.primary }}
      >
        <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi, color: colors.white }} numberOfLines={1}>
          Réessayer
        </AppText>
      </Pressable>
    </View>
  ) : (
    <>
      <View style={{ marginTop: 18 }}>
        <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20, marginBottom: 12 }} numberOfLines={1}>
          Transactions enregistrées
        </AppText>
        <StatusChipRow
          chips={[
            { label: "Livraison", count: serviceTypes.livraison, iconName: "solar:delivery-bold-duotone", color: colors.primary },
            { label: "Expédition", count: serviceTypes.expedition, iconName: "solar:rocket-bold-duotone", color: colors.primary },
            { label: "Course", count: serviceTypes.course, iconName: "solar:routing-bold-duotone", color: colors.primary },
            { label: "Ramassage", count: serviceTypes.ramassage, iconName: "solar:hand-shake-bold", color: colors.primary },
          ]}
        />
      </View>

      <View style={{ marginTop: 18 }}>
        <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20, marginBottom: 12 }} numberOfLines={1}>
          Statuts
        </AppText>
        <StatusChipRow
          chips={[
            { label: "En cours", count: buckets.enCours, iconName: "solar:clock-circle-outline", color: colors.primary },
            { label: "Livré", count: buckets.delivered, iconName: "solar:check-circle-bold", color: "#16A34A" },
            { label: "Injoignable", count: buckets.injoignable, iconName: "solar:phone-outline", color: "#B45309" },
            { label: "Annulé", count: buckets.annule, iconName: "solar:close-circle-bold", color: "#DC2626" },
          ]}
        />
      </View>

      <View style={{ marginTop: 18 }}>
        <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20, marginBottom: 12 }} numberOfLines={1}>
          Comptabilité
        </AppText>
      </View>
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Total encaissé"
              value={formatted.totalEncaisse}
              suffix={formatted.totalSuffix}
              delta={formatted.totalEncaisseDelta}
              iconName="solar:wallet-bold-duotone"
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Frais de livraison"
              value={formatted.feesWithdrawn}
              suffix={formatted.totalSuffix}
              delta={formatted.feesWithdrawnDelta}
              iconName="solar:hashtag-outline"
              compact
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Total commandes"
              value={formatted.totalCmd}
              suffix={formatted.totalSuffix}
              delta={formatted.totalCmdDelta}
              iconName="solar:notes-outline"
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Solde"
              value={formatted.resteAPercevoir}
              suffix={formatted.totalSuffix}
              delta={formatted.resteAPercevoirDelta}
              iconName="solar:banknote-outline"
              compact
            />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20, marginBottom: 12 }} numberOfLines={1}>
          Stock en magasin
        </AppText>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Produits en stock"
              value={formatted.stockProductsCount}
              delta={formatted.stockProductsCountDelta}
              iconName="solar:box-bold-duotone"
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Quantité stock (total)"
              value={formatted.stockQtyTotal}
              delta={formatted.stockQtyTotalDelta}
              iconName="solar:box-bold"
              compact
            />
          </View>
        </View>
      </View>
    </>
  );

  return (
    <ScreenLayout
      scrollViewProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={() => void loadReports("refresh")} />,
      }}
      header={
        <View style={{ paddingBottom: 10 }}>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Rapports d&apos;activité
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]} numberOfLines={2} ellipsizeMode="tail">
            {periodLabel}
          </AppText>
          <RangeToggle value={range} onChange={setRange} />
          {range === "Personnalisé" ? (
            <ReportCustomDateRange
              startDate={customStart}
              endDate={customEnd}
              onChangeStart={setCustomStart}
              onChangeEnd={setCustomEnd}
              maximumDate={new Date()}
            />
          ) : null}
        </View>
      }
    >
      {body}
    </ScreenLayout>
  );
}
