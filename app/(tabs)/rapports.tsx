import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import DeliveryHistoryCard from "../../components/DeliveryHistoryCard";
import DonutCard from "../../components/DonutCard";
import MetricCard from "../../components/MetricCard";
import SolarIcon from "../../components/SolarIcon";
import { card, row } from "../../theme/styles";
import { colors, fonts, radii, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";

type Range = "Journalier" | "Hebdo" | "Mensuel";

type BucketCounts = {
  delivered: number;
  injoignable: number;
  annule: number;
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
    }
  }

  const totalRelevant = delivered + injoignable + annule;
  return { delivered, injoignable, annule, totalRelevant };
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
  amount_due: number;
  status: string;
  created_at: string;
};

const MOCK_CURRENT: MockDelivery[] = [
  { id: "101", items: "Panier de légumes bio", amount_due: 4000, status: "pending", created_at: new Date().toISOString() },
  { id: "102", items: "Chaussures x2", amount_due: 15000, status: "delivered", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "103", items: "Colis divers", amount_due: 2500, status: "cancelled", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const MOCK_PREVIOUS: MockDelivery[] = [
  { id: "201", items: "Colis divers", amount_due: 3200, status: "delivered", created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "202", items: "Panier de fruits", amount_due: 5000, status: "delivered", created_at: new Date(Date.now() - 9 * 86400000).toISOString() },
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

    const collectXafCurrent = current.reduce((sum, d) => sum + (safeNumber(d.amount_due) > 0 ? safeNumber(d.amount_due) : 0), 0);
    const collectXafPrevious = previous.reduce((sum, d) => sum + (safeNumber(d.amount_due) > 0 ? safeNumber(d.amount_due) : 0), 0);

    const buckets = bucketCounts(current);
    const successPct = pct(buckets.delivered, Math.max(buckets.totalRelevant, 1));
    const deliveredPct = pct(buckets.delivered, Math.max(buckets.totalRelevant, 1));
    const injoignablePct = pct(buckets.injoignable, Math.max(buckets.totalRelevant, 1));
    const annulePct = pct(buckets.annule, Math.max(buckets.totalRelevant, 1));

    const history = [...current]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, 10)
      .map((d) => ({
        id: String(d.id),
        title: deriveTitle(d),
        meta: `${formatHistoryMeta(d)} • ${statusLabel(String(d.status ?? ""))}`,
        amount: `${formatXaf(safeNumber(d.amount_due))} XAF`,
        tag: deriveTag(d),
      }));

    return {
      deliveriesCount: String(count),
      deliveriesDelta: formatDeltaPct(count, prevCount),
      collectAmount: formatXaf(collectXafCurrent),
      collectDelta: formatDeltaPct(collectXafCurrent, collectXafPrevious),
      totalSuffix: "XAF",
      successPct,
      buckets,
      legend: {
        delivered: `${deliveredPct}% (${buckets.delivered})`,
        injoignable: `${injoignablePct}% (${buckets.injoignable})`,
        annule: `${annulePct}% (${buckets.annule})`,
      },
      history,
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

      {/* Metric cards */}
      <View style={{ marginTop: 18, gap: 16 }}>
        <MetricCard
          title="Livraisons"
          value={computed.deliveriesCount}
          delta={computed.deliveriesDelta}
          iconName="solar:box-bold-duotone"
        />
        <MetricCard
          title="Montant à encaisser"
          value={computed.collectAmount}
          suffix={computed.totalSuffix}
          delta={computed.collectDelta}
          iconName="solar:wallet-bold-duotone"
        />
      </View>

      {/* Success donut + legend */}
      <View style={{ marginTop: 18 }}>
        <DonutCard successPct={computed.successPct} legend={computed.legend} />
      </View>

      {/* Historique */}
      <View style={{ marginTop: 18 }}>
        <View style={{ ...row.spaceBetween, marginBottom: 12 }}>
          <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }} numberOfLines={1}>
            Historique
          </AppText>
          <Pressable onPress={() => router.push("/(tabs)/livraison")} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="dense" style={{ ...typography.link, fontSize: 12 }} numberOfLines={1}>
              Voir tout
            </AppText>
            <SolarIcon name="solar:alt-arrow-right-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          {computed.history.map((it) => (
            <DeliveryHistoryCard
              key={it.id}
              title={it.title}
              meta={it.meta}
              amount={it.amount}
              tag={it.tag}
              onPress={() => router.push(`/livraison-detail/${it.id}`)}
            />
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

