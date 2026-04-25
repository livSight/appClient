import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import MetricCard from "../../components/MetricCard";
import SolarIcon from "../../components/SolarIcon";
import { row } from "../../theme/styles";
import { colors, fonts, radii, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";

type Range = "Journalier" | "Hebdo" | "Mensuel";

type BucketCounts = {
  delivered: number;
  injoignable: number;
  annule: number;
  enCours: number;
  totalRelevant: number;
};

function safeNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function formatXaf(n: number): string {
  const v = Math.max(0, Math.round(safeNumber(n)));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function deriveTitle(d: MockDelivery): string {
  return d.items?.trim() ? d.items.trim() : "Livraison";
}

function deriveTag(d: MockDelivery): string {
  const s = String(d.status ?? "").toLowerCase();
  if (s === "pickup") return "PICKUP";
  if (s === "expedition") return "EXPEDITION";
  return "LIVRAISON";
}


function formatHistoryMeta(d: MockDelivery): string {
  const iso = d.created_at;
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  // Keep it short like the Figma list
  return dt.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(raw: string): string {
  const s = String(raw ?? "").toLowerCase();
  if (s === "delivered") return "Livré";
  if (s === "failed" || s === "cancelled") return "Annulé";
  return "En cours";
}

function bucketCounts(deliveries: MockDelivery[]): BucketCounts {
  let delivered = 0;
  let injoignable = 0;
  let annule = 0;
  let enCours = 0;

  for (const d of deliveries) {
    const s = String(d.status ?? "").toLowerCase();
    if (s === "delivered") delivered += 1; // pickup excluded by decision
    else if (
      s === "unreachable" ||
      s === "no_answer" ||
      s === "present_ne_decroche_zone1" ||
      s === "present_ne_decroche_zone2"
    ) {
      injoignable += 1;
    } else if (s === "failed" || s === "cancelled") {
      annule += 1;
    } else {
      enCours += 1;
    }
  }

  const totalRelevant = delivered + injoignable + annule;
  return { delivered, injoignable, annule, enCours, totalRelevant };
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function formatDeltaPct(current: number, prev: number): string {
  const denom = Math.max(prev, 1);
  const delta = Math.round(((current - prev) / denom) * 100);
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta}%`;
}

function startOfWeekMonday(d: Date): Date {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

function endOfWeekSunday(d: Date): Date {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatDateLongFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDayMonthFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

function formatMonthYearFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatPeriodLabel(range: Range, now: Date): string {
  if (range === "Journalier") return `Aujourd’hui — ${formatDateLongFr(now)}`;
  if (range === "Mensuel") return formatMonthYearFr(now);
  const start = startOfWeekMonday(now);
  const end = endOfWeekSunday(now);
  return `Semaine du ${formatDayMonthFr(start)} au ${formatDateLongFr(end)}`;
}

function RangeToggle({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
  const opts: Range[] = ["Journalier", "Hebdo", "Mensuel"];
  return (
    <View
      style={{
        minHeight: 48,
        borderRadius: radii.pill,
        backgroundColor: "#F1F3F5",
        padding: 6,
        flexDirection: "row",
        gap: 6,
        marginTop: 14,
      }}
    >
      {opts.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              flex: 1,
              borderRadius: radii.pill,
              backgroundColor: active ? colors.white : "transparent",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 8,
            }}
          >
            <AppText
              variant="dense"
              style={{ fontSize: 12, fontFamily: active ? fonts.bodyBold : fonts.bodySemi, color: colors.text }}
              numberOfLines={1}
            >
              {o}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}



type MockDelivery = {
  id: string;
  items: string;
  amount_due: number; // Montant cmd
  amount_received: number; // Montant reçu
  fees_withdrawn: number; // Tarifs retirés
  status: string;
  created_at: string;
};

const MOCK_CURRENT: MockDelivery[] = [
  { id: "101", items: "Panier de légumes bio", amount_due: 4000, amount_received: 0, fees_withdrawn: 0, status: "pending", created_at: new Date().toISOString() },
  { id: "102", items: "Chaussures x2", amount_due: 15000, amount_received: 15000, fees_withdrawn: 250, status: "delivered", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "103", items: "Colis divers", amount_due: 2500, amount_received: 0, fees_withdrawn: 0, status: "cancelled", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const MOCK_PREVIOUS: MockDelivery[] = [
  { id: "201", items: "Colis divers", amount_due: 3200, amount_received: 3200, fees_withdrawn: 200, status: "delivered", created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "202", items: "Panier de fruits", amount_due: 5000, amount_received: 5000, fees_withdrawn: 250, status: "delivered", created_at: new Date(Date.now() - 9 * 86400000).toISOString() },
];

export default function RapportsScreen() {
  const [range, setRange] = useState<Range>("Journalier");
  // UI-only: keep range toggle for UI, but use mock data.
  const current = useMemo(() => MOCK_CURRENT, []);
  const previous = useMemo(() => MOCK_PREVIOUS, []);
  const periodLabel = useMemo(() => formatPeriodLabel(range, new Date()), [range]);

  const computed = useMemo(() => {
    const count = current.length;
    const prevCount = previous.length;

    const totalCmdCurrent = current.reduce((sum, d) => sum + (safeNumber(d.amount_due) > 0 ? safeNumber(d.amount_due) : 0), 0);
    const totalCmdPrevious = previous.reduce((sum, d) => sum + (safeNumber(d.amount_due) > 0 ? safeNumber(d.amount_due) : 0), 0);

    const totalReceivedCurrent = current.reduce((sum, d) => sum + (safeNumber(d.amount_received) > 0 ? safeNumber(d.amount_received) : 0), 0);
    const totalReceivedPrevious = previous.reduce((sum, d) => sum + (safeNumber(d.amount_received) > 0 ? safeNumber(d.amount_received) : 0), 0);

    const feesWithdrawnCurrent = current.reduce((sum, d) => sum + (safeNumber(d.fees_withdrawn) > 0 ? safeNumber(d.fees_withdrawn) : 0), 0);
    const feesWithdrawnPrevious = previous.reduce((sum, d) => sum + (safeNumber(d.fees_withdrawn) > 0 ? safeNumber(d.fees_withdrawn) : 0), 0);

    const totalEncaissedCurrent = totalReceivedCurrent; // UI-only: encaissé == reçu
    const totalEncaissedPrevious = totalReceivedPrevious;

    const resteAPercevoirCurrent = Math.max(totalCmdCurrent - totalEncaissedCurrent, 0);
    const resteAPercevoirPrevious = Math.max(totalCmdPrevious - totalEncaissedPrevious, 0);

    const buckets = bucketCounts(current);

    // UI-only mock stock snapshot
    const stockProductsCountCurrent = 7;
    const stockQtyTotalCurrent = 29;
    const stockProductsCountPrevious = 6;
    const stockQtyTotalPrevious = 24;

    return {
      deliveriesCount: String(count),
      deliveriesDelta: formatDeltaPct(count, prevCount),

      totalCmd: formatXaf(totalCmdCurrent),
      totalCmdDelta: formatDeltaPct(totalCmdCurrent, totalCmdPrevious),

      totalReceived: formatXaf(totalReceivedCurrent),
      totalReceivedDelta: formatDeltaPct(totalReceivedCurrent, totalReceivedPrevious),

      totalEncaissed: formatXaf(totalEncaissedCurrent),
      totalEncaissedDelta: formatDeltaPct(totalEncaissedCurrent, totalEncaissedPrevious),

      resteAPercevoir: formatXaf(resteAPercevoirCurrent),
      resteAPercevoirDelta: formatDeltaPct(resteAPercevoirCurrent, resteAPercevoirPrevious),

      feesWithdrawn: formatXaf(feesWithdrawnCurrent),
      feesWithdrawnDelta: formatDeltaPct(feesWithdrawnCurrent, feesWithdrawnPrevious),

      stockProductsCount: String(stockProductsCountCurrent),
      stockProductsCountDelta: formatDeltaPct(stockProductsCountCurrent, stockProductsCountPrevious),

      stockQtyTotal: String(stockQtyTotalCurrent),
      stockQtyTotalDelta: formatDeltaPct(stockQtyTotalCurrent, stockQtyTotalPrevious),

      totalSuffix: "FCFA",
      buckets,
    };
  }, [current, previous]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30, flex: 1, paddingRight: 12 }]} numberOfLines={2}>
              Rapports d&apos;activité
            </AppText>
            <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 }}>
              <SolarIcon name="solar:download-outline" size={24} color={colors.text} />
              <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
                Exporter
              </AppText>
            </Pressable>
          </View>
          <AppText style={[typography.subtitle, { marginTop: 4 }]} numberOfLines={2} ellipsizeMode="tail">
            {periodLabel}
          </AppText>
          <RangeToggle value={range} onChange={setRange} />
        </View>
      }
    >

      {/* Chiffres */}
      <View style={{ marginTop: 18, gap: 16 }}>
        <MetricCard
          title="Livraisons"
          value={computed.deliveriesCount}
          delta={computed.deliveriesDelta}
          iconName="solar:box-bold-duotone"
        />
        <MetricCard
          title="Total commandes"
          value={computed.totalCmd}
          suffix={computed.totalSuffix}
          delta={computed.totalCmdDelta}
          iconName="solar:notes-outline"
        />
        <MetricCard
          title="Total encaissé"
          value={computed.totalEncaissed}
          suffix={computed.totalSuffix}
          delta={computed.totalEncaissedDelta}
          iconName="solar:wallet-bold-duotone"
        />
        <MetricCard
          title="Total reçu"
          value={computed.totalReceived}
          suffix={computed.totalSuffix}
          delta={computed.totalReceivedDelta}
          iconName="solar:card-outline"
        />
        <MetricCard
          title="Reste à percevoir"
          value={computed.resteAPercevoir}
          suffix={computed.totalSuffix}
          delta={computed.resteAPercevoirDelta}
          iconName="solar:clock-circle-outline"
        />
        <MetricCard
          title="Total tarifs (retirés)"
          value={computed.feesWithdrawn}
          suffix={computed.totalSuffix}
          delta={computed.feesWithdrawnDelta}
          iconName="solar:hashtag-outline"
        />
        <MetricCard
          title="Produits en stock"
          value={computed.stockProductsCount}
          delta={computed.stockProductsCountDelta}
          iconName="solar:box-bold-duotone"
        />
        <MetricCard
          title="Quantité stock (total)"
          value={computed.stockQtyTotal}
          delta={computed.stockQtyTotalDelta}
          iconName="solar:box-bold"
        />
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={{ ...row.spaceBetween, marginBottom: 12 }}>
          <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }} numberOfLines={1}>
            Statuts
          </AppText>
        </View>

        <View style={{ gap: 16 }}>
          <MetricCard title="En cours" value={String(computed.buckets.enCours)} iconName="solar:clock-circle-outline" />
          <MetricCard title="Livré" value={String(computed.buckets.delivered)} iconName="solar:check-circle-bold" />
          <MetricCard title="Injoignable" value={String(computed.buckets.injoignable)} iconName="solar:phone-outline" />
          <MetricCard title="Annulé" value={String(computed.buckets.annule)} iconName="solar:close-circle-bold" />
        </View>
      </View>
    </ScreenLayout>
  );
}

