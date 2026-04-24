import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { Download, ShoppingBag, Wallet, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import OrderCard from "../../components/OrderCard";
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
    <View style={[card.base, { padding: 20, minHeight: 120, justifyContent: "center" }]}>
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
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText
              variant="dense"
              style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </AppText>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 12 }}>
        <AppText style={{ fontSize: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </AppText>
        {suffix ? (
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, marginLeft: 10, marginBottom: 4 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {suffix}
          </AppText>
        ) : null}
      </View>

      {delta ? (
        <AppText variant="dense" style={{ marginTop: 6, fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
          {delta}
        </AppText>
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {label}
          </AppText>
        </View>
      </View>
      <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
        {pct}
      </AppText>
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
      <AppText style={{ fontSize: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
        {pct}%
      </AppText>
      <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
        de reussite
      </AppText>
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
        <View>
          <View style={{ minHeight: 44, paddingVertical: 8, alignItems: "flex-end", justifyContent: "center" }}>
            <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Download size={18} color={colors.text} />
              <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
                Exporter
              </AppText>
            </Pressable>
          </View>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Rapports d&apos;activité
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Suivez vos performances
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
          <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }} numberOfLines={2} ellipsizeMode="tail">
            Taux de réussite
          </AppText>
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
          <AppText style={{ ...typography.sectionTitle, fontSize: 14, lineHeight: 20 }} numberOfLines={1}>
            Historique
          </AppText>
          <Pressable onPress={() => router.push("/(tabs)/livraison")} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="dense" style={{ ...typography.link, fontSize: 12 }} numberOfLines={1}>
              Voir tout
            </AppText>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          {computed.history.map((it) => (
            <OrderCard
              key={it.id}
              title={it.title}
              subtitle={it.meta}
              rightTop={it.amount}
              rightBottom={it.tag}
              onPress={() => router.push(`/livraison-detail/${it.id}`)}
            />
          ))}
        </View>
      </View>
    </ScreenLayout>
  );
}

