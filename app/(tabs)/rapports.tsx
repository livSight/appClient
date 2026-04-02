import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Download, ShoppingBag, Wallet, ChevronRight } from "lucide-react-native";
import ScreenLayout from "../../components/ScreenLayout";
import DeliveryHistoryCard from "../../components/DeliveryHistoryCard";
import { card, row } from "../../theme/styles";
import { colors, radii, typography } from "../../theme/tokens";
import { listVendorDeliveries, type VendorDelivery } from "@/lib/api/vendor";

type Range = "Journalier" | "Hebdo" | "Mensuel";

type BucketCounts = {
  delivered: number;
  injoignable: number;
  annule: number;
  totalRelevant: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startEndForRange(range: Range): { start: Date; end: Date; days: number } {
  const end = new Date();
  // inclusive windows (server slices by YYYY-MM-DD)
  const days = range === "Journalier" ? 1 : range === "Hebdo" ? 7 : 30;
  const start = addDays(end, -(days - 1));
  return { start, end, days };
}

function previousWindow(start: Date, days: number): { start: Date; end: Date } {
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: prevStart, end: prevEnd };
}

function safeNumber(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function deriveTitle(d: VendorDelivery): string {
  return d.customer_name?.trim()
    ? d.customer_name.trim()
    : d.items?.trim()
      ? d.items.trim()
      : d.phone;
}

function deriveTag(d: VendorDelivery): string {
  const s = String(d.status ?? "").toLowerCase();
  if (s === "pickup") return "PICKUP";
  if (s === "expedition") return "EXPEDITION";
  return "LIVRAISON";
}

function formatHistoryMeta(d: VendorDelivery): string {
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

function bucketCounts(deliveries: VendorDelivery[]): BucketCounts {
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
        height: 48,
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
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: active ? "700" : "600", color: colors.text }}>
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  delta,
  Icon,
}: {
  title: string;
  value: string;
  suffix?: string;
  delta?: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View style={[card.base, { padding: 20, height: 120, justifyContent: "center" }]}>
      <View style={{ ...row.spaceBetween }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radii.pill,
              backgroundColor: colors.iconBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={colors.primary} />
          </View>
          <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }}>{title}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text }}>{value}</Text>
        {suffix ? (
          <Text style={{ ...typography.subtitle, marginLeft: 10, marginBottom: 4 }}>{suffix}</Text>
        ) : null}
      </View>

      {delta ? (
        <Text style={{ marginTop: 6, fontSize: 12, fontWeight: "700", color: colors.primary }}>
          {delta}
        </Text>
      ) : null}

      {/* Decorative circle */}
      <View
        style={{
          position: "absolute",
          right: -10,
          top: 10,
          width: 64,
          height: 64,
          borderRadius: 9999,
          backgroundColor: "rgba(48,144,192,0.10)",
        }}
      />
    </View>
  );
}

function LegendRow({ label, pct, color }: { label: string; pct: string; color: string }) {
  return (
    <View style={{ ...row.spaceBetween, marginTop: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: color }} />
        <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>{pct}</Text>
    </View>
  );
}

function Donut({ pct }: { pct: number }) {
  // Lightweight approximation (static) without adding chart deps.
  return (
    <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 9999,
          borderWidth: 16,
          borderColor: "#E5E7EB",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 160,
          height: 160,
          borderRadius: 9999,
          borderWidth: 16,
          borderColor: "#22C55E",
          borderRightColor: "#F59E0B",
          borderTopColor: "#EF4444",
          transform: [{ rotate: "-90deg" }],
        }}
      />
      <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>{pct}%</Text>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 2 }}>
        de reussite
      </Text>
    </View>
  );
}

export default function RapportsScreen() {
  const [range, setRange] = useState<Range>("Journalier");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<VendorDelivery[]>([]);
  const [previous, setPrevious] = useState<VendorDelivery[]>([]);

  const { start, end, days } = useMemo(() => startEndForRange(range), [range]);
  const prevWindow = useMemo(() => previousWindow(start, days), [start, days]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [cur, prev] = await Promise.all([
        listVendorDeliveries({
          page: 1,
          limit: 500,
          sortBy: "created_at",
          sortOrder: "DESC",
          startDate: formatYmd(start),
          endDate: formatYmd(end),
        }),
        listVendorDeliveries({
          page: 1,
          limit: 500,
          sortBy: "created_at",
          sortOrder: "DESC",
          startDate: formatYmd(prevWindow.start),
          endDate: formatYmd(prevWindow.end),
        }),
      ]);
      setCurrent(cur);
      setPrevious(prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const computed = useMemo(() => {
    const count = current.length;
    const prevCount = previous.length;

    const totalAmount = current.reduce((sum, d) => sum + safeNumber(d.amount_due), 0);

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
        meta: `${formatHistoryMeta(d)} • ${String(d.status ?? "").toLowerCase() === "delivered" ? "Livré" : "En cours"}`,
        amount: `${safeNumber(d.amount_due)} XAF`,
        tag: deriveTag(d),
      }));

    return {
      deliveriesCount: String(count),
      deliveriesDelta: formatDeltaPct(count, prevCount),
      totalAmount: String(totalAmount),
      totalSuffix: "XAF",
      successPct,
      legend: {
        delivered: `${deliveredPct}%`,
        injoignable: `${injoignablePct}%`,
        annule: `${annulePct}%`,
      },
      history,
    };
  }, [current, previous]);

  return (
    <ScreenLayout
      header={
        <View style={{ ...row.spaceBetween, height: 44, marginBottom: 6 }}>
          <View style={{ width: 44 }} />
          <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Rapports</Text>
          <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Download size={18} color={colors.text} />
            <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Exporter</Text>
          </Pressable>
        </View>
      }
    >

      <Text style={{ ...typography.screenTitle, fontSize: 22, lineHeight: 28 }}>
        Rapports d&apos;activité
      </Text>
      <RangeToggle value={range} onChange={setRange} />

      {loading ? (
        <View style={{ paddingVertical: 28, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 16 }}>
          <Text style={{ color: "#D32F2F", fontWeight: "600", marginBottom: 12 }}>{error}</Text>
          <Pressable
            onPress={load}
            style={{
              height: 44,
              borderRadius: radii.pill,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 18,
              alignSelf: "flex-start",
            }}
          >
            <Text style={typography.buttonTextInverse}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Metric cards */}
      <View style={{ marginTop: 18, gap: 16 }}>
        <MetricCard
          title="Livraisons"
          value={computed.deliveriesCount}
          delta={computed.deliveriesDelta}
          Icon={ShoppingBag}
        />
        <MetricCard
          title="Montant Total"
          value={computed.totalAmount}
          suffix={computed.totalSuffix}
          Icon={Wallet}
        />
      </View>

      {/* Success donut + legend */}
      <View style={{ marginTop: 18 }}>
        <View style={[card.base, { padding: 24 }]}>
          <Text style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }}>
            Taux de réussite
          </Text>
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Donut pct={computed.successPct} />
          </View>
          <View style={{ marginTop: 10 }}>
            <LegendRow label="Livré" pct={computed.legend.delivered} color="#22C55E" />
            <LegendRow label="Client injoignable" pct={computed.legend.injoignable} color="#F59E0B" />
            <LegendRow label="Annulé" pct={computed.legend.annule} color="#EF4444" />
          </View>
        </View>
      </View>

      {/* Historique */}
      <View style={{ marginTop: 18 }}>
        <View style={{ ...row.spaceBetween, marginBottom: 12 }}>
          <Text style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }}>Historique</Text>
          <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ ...typography.link, fontSize: 12 }}>Voir tout</Text>
            <ChevronRight size={16} color={colors.primary} />
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
            />
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

