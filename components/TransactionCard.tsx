import { useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import SolarIcon from "./SolarIcon";
import AppText from "./AppText";
import { card } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticLight } from "@/lib/haptics";

type StatusBucket = "En cours" | "Livré" | "Annulé";

export type TransactionCardItem = {
  id: string;
  ref?: string;
  title: string;
  quartier: string;
  dateLabel: string;
  /** Creation timestamp (ms) used for date filtering; null when the API date is missing/invalid */
  createdAtMs?: number | null;
  status: StatusBucket;
  statusLabel: string;
  amountLabel?: string;
  paymentLabel?: string;
  serviceLabel?: string;
  sourceLabel?: string;
  expressLabel?: string;
  isExpedition: boolean;
};

function StatusPill({ label, status }: { label: string; status: StatusBucket }) {
  const bg =
    status === "En cours"
      ? colors.statusPendingBg
      : status === "Livré"
        ? colors.statusDeliveredBg
        : colors.statusCancelledBg;

  const fg =
    status === "En cours"
      ? colors.primary
      : status === "Livré"
        ? colors.statusDeliveredFg
        : colors.statusCancelledFg;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        minHeight: 26,
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="dense" style={{ fontSize: 10, fontFamily: fonts.bodyBold, color: fg, letterSpacing: 0.6 }} numberOfLines={1}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

function MetaPill({ label, variant }: { label: string; variant: "neutral" | "primary" | "express" }) {
  const safe = label.trim();
  if (!safe.length) return null;

  const backgroundColor =
    variant === "primary" ? colors.statusPendingBg : variant === "express" ? colors.iconBg : colors.placeholderBg;
  const color = variant === "primary" || variant === "express" ? colors.primary : colors.text;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        minHeight: 26,
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="dense" style={{ fontSize: 10, fontFamily: fonts.bodyBold, color, letterSpacing: 0.6 }} numberOfLines={1}>
        {safe.toUpperCase()}
      </AppText>
    </View>
  );
}

function collectMetaPills(item: TransactionCardItem): { label: string; variant: "neutral" | "primary" | "express" }[] {
  const pills: { label: string; variant: "neutral" | "primary" | "express" }[] = [];
  const seen = new Set<string>();

  const add = (label: string | undefined, variant: "neutral" | "primary" | "express") => {
    const safe = String(label ?? "").trim();
    if (!safe.length) return;
    const key = safe.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    pills.push({ label: safe, variant });
  };

  add(item.serviceLabel, "neutral");
  add(item.sourceLabel, "primary");
  add(item.expressLabel, "express");

  return pills;
}

export default function TransactionCard({
  item,
  onPress,
}: {
  item: TransactionCardItem;
  onPress?: () => void | Promise<void>;
}) {
  const iconName = useMemo(() => {
    const t = String(item.title ?? "").toLowerCase();
    if (t.includes("vêt") || t.includes("vet")) return "solar:t-shirt-bold-duotone";
    if (
      t.includes("nourrit") ||
      t.includes("panier") ||
      t.includes("légume") ||
      t.includes("legume") ||
      t.includes("fruit") ||
      t.includes("épicerie") ||
      t.includes("epicerie")
    )
      return "solar:bag-bold-duotone";
    if (t.includes("iphone") || t.includes("électron") || t.includes("electron") || t.includes("smart")) return "solar:smartphone-bold-duotone";
    return "solar:box-bold-duotone";
  }, [item.title]);

  const ref = item.ref ?? item.id;
  const metaPills = useMemo(() => collectMetaPills(item), [item]);
  const subtitle = [item.quartier !== "—" ? item.quartier : null, item.dateLabel !== "—" ? item.dateLabel : null, item.paymentLabel]
    .filter(Boolean)
    .join("  ·  ");
  const detailPath = item.isExpedition ? `/expedition-detail/${item.id}` : `/livraison-detail/${item.id}`;
  const accessibilityLabel = `Ouvrir la course ${item.title}, référence ${ref}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={async () => {
        await hapticLight();
        if (onPress) {
          await onPress();
          return;
        }
        router.push(detailPath);
      }}
      style={[card.base, { padding: 16 }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: metaPills.length ? 8 : 12 }}>
        <AppText
          variant="dense"
          style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.55)", letterSpacing: 0.4, flex: 1, minWidth: 0, paddingRight: 10 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          REF {ref}
        </AppText>
        <StatusPill label={item.statusLabel} status={item.status} />
      </View>

      {metaPills.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          style={{ flexGrow: 0 }}
        >
          {metaPills.map((pill) => (
            <MetaPill key={pill.label} label={pill.label} variant={pill.variant} />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
          <SolarIcon name={iconName} size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingRight: item.amountLabel ? 12 : 0 }}>
          <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 20 }} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </AppText>
          {subtitle.length ? (
            <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 11, lineHeight: 16, marginTop: 3 }} numberOfLines={1} ellipsizeMode="tail">
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {item.amountLabel ? (
          <View style={{ flexShrink: 0, alignItems: "flex-end" }}>
            <AppText style={{ fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 22 }} numberOfLines={1}>
              {item.amountLabel}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
