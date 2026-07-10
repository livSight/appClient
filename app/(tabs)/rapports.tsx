import { useCallback, useMemo, useState } from "react";
import { Alert, View, Pressable, RefreshControl, ActivityIndicator, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router/react-navigation";
import ScreenLayout from "../../components/ScreenLayout";
import MetricCard from "../../components/MetricCard";
import SolarIcon from "../../components/SolarIcon";
import { colors, fonts, radii, shadows, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";
import ReportCustomDateRange from "@/components/ReportCustomDateRange";
import {
  fetchDeliveryReport,
  fetchStockReport,
  sourceCountsFromDeliveries,
  statusBucketsFromSummary,
  toReportDateParam,
  type DeliveryReport,
  type StockReport,
} from "@/lib/api/reports";
import { downloadAndShareReportPdf, PDF_MODULES_UNAVAILABLE_MESSAGE } from "@/lib/reports/reportPdf";
import {
  formatDeltaPct,
  formatPeriodLabel,
  formatXaf,
  resolveReportPeriodBounds,
  type ReportRange,
} from "@/lib/reports/aggregateReports";
import { logger } from "@/lib/logger";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function safeCount(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
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

function PdfButton({
  label,
  busy,
  onPress,
}: {
  label: string;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      style={{
        flex: 1,
        minHeight: 52,
        borderRadius: radii.pill,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: "rgba(48,144,192,0.35)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <SolarIcon name="solar:download-outline" size={20} color={colors.primary} />
      )}
      <AppText
        variant="dense"
        style={{ fontSize: 13, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.primary }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function RapportsScreen() {
  const [range, setRange] = useState<ReportRange>("Journalier");
  const [customStart, setCustomStart] = useState(() => startOfMonth(new Date()));
  const [customEnd, setCustomEnd] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<DeliveryReport | null>(null);
  const [previousReport, setPreviousReport] = useState<DeliveryReport | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<"deliveries" | "stock" | null>(null);

  const period = useMemo(() => {
    const bounds = resolveReportPeriodBounds({ range, now: new Date(), customStart, customEnd });
    return {
      start: toReportDateParam(bounds.current.start),
      end: toReportDateParam(bounds.current.end),
      prevStart: toReportDateParam(bounds.previous.start),
      prevEnd: toReportDateParam(bounds.previous.end),
    };
  }, [range, customStart, customEnd]);

  const loadReports = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);
        setError(null);

        const [current, previous, stock] = await Promise.all([
          fetchDeliveryReport(period.start, period.end),
          fetchDeliveryReport(period.prevStart, period.prevEnd),
          fetchStockReport(period.start, period.end),
        ]);
        setReport(current);
        setPreviousReport(previous);
        setStockReport(stock);
      } catch (e: unknown) {
        logger.warn("rapports", "load failed", e);
        setError("Impossible de charger vos rapports. Vérifiez votre connexion et réessayez.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  useFocusEffect(
    useCallback(() => {
      void loadReports("initial");
    }, [loadReports]),
  );

  const periodLabel = useMemo(
    () => formatPeriodLabel(range, new Date(), { start: customStart, end: customEnd }),
    [range, customStart, customEnd],
  );

  const buckets = useMemo(() => statusBucketsFromSummary(report?.status_summary), [report?.status_summary]);
  const sources = useMemo(() => sourceCountsFromDeliveries(report?.deliveries), [report?.deliveries]);

  async function onDownloadPdf(kind: "deliveries" | "stock") {
    if (downloadingPdf) return;
    setDownloadingPdf(kind);
    try {
      await downloadAndShareReportPdf(kind, period.start, period.end);
    } catch (e: unknown) {
      logger.warn("rapports", "pdf download failed", e);
      const message =
        e instanceof Error && e.message === PDF_MODULES_UNAVAILABLE_MESSAGE
          ? e.message
          : "Le rapport PDF n'a pas pu être téléchargé. Vérifiez votre connexion et réessayez.";
      Alert.alert("Téléchargement impossible", message);
    } finally {
      setDownloadingPdf(null);
    }
  }

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
          Livraisons enregistrées
        </AppText>
        <StatusChipRow
          chips={[
            { label: "Total", count: safeCount(report?.delivery_count), iconName: "solar:delivery-bold-duotone", color: colors.primary },
            { label: "En stock", count: sources.stock, iconName: "solar:box-bold-duotone", color: colors.primary },
            { label: "Ramassage", count: sources.pickup, iconName: "solar:hand-shake-bold", color: colors.primary },
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
              value={formatXaf(safeCount(report?.total_encaisse))}
              suffix="FCFA"
              delta={formatDeltaPct(safeCount(report?.total_encaisse), safeCount(previousReport?.total_encaisse))}
              iconName="solar:wallet-bold-duotone"
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Frais de livraison"
              value={formatXaf(safeCount(report?.total_tarifs))}
              suffix="FCFA"
              delta={formatDeltaPct(safeCount(report?.total_tarifs), safeCount(previousReport?.total_tarifs))}
              iconName="solar:hashtag-outline"
              compact
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Total commandes"
              value={formatXaf(safeCount(report?.total_commande))}
              suffix="FCFA"
              delta={formatDeltaPct(safeCount(report?.total_commande), safeCount(previousReport?.total_commande))}
              iconName="solar:notes-outline"
              compact
            />
          </View>
          <View style={{ flex: 1 }}>
            <MetricCard
              title="Solde"
              value={formatXaf(safeCount(report?.reste_a_percevoir))}
              suffix="FCFA"
              delta={formatDeltaPct(safeCount(report?.reste_a_percevoir), safeCount(previousReport?.reste_a_percevoir))}
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
        <StatusChipRow
          chips={[
            { label: "Produits", count: safeCount(stockReport?.total_products), iconName: "solar:box-bold-duotone", color: colors.primary },
            { label: "Quantité totale", count: safeCount(stockReport?.total_quantity_in_stock), iconName: "solar:box-bold", color: colors.primary },
            { label: "En rupture", count: safeCount(stockReport?.out_of_stock_count), iconName: "solar:danger-circle-bold", color: "#DC2626" },
          ]}
        />
      </View>

      <View style={{ marginTop: 22, flexDirection: "row", gap: 12 }}>
        <PdfButton
          label="PDF Livraisons"
          busy={downloadingPdf === "deliveries"}
          onPress={() => void onDownloadPdf("deliveries")}
        />
        <PdfButton
          label="PDF Stock"
          busy={downloadingPdf === "stock"}
          onPress={() => void onDownloadPdf("stock")}
        />
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
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 34 }]} numberOfLines={2}>
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
