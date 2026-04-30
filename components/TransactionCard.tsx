import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import SolarIcon from "./SolarIcon";
import AppText from "./AppText";
import { card } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

export type TransactionCardItem = {
  id: string;
  ref?: string;
  title: string;
  quartier: string;
  dateLabel: string;
  status: Status;
  amountLabel: string;
  paymentLabel?: string;
  typeLabel?: string;
  modeLabel?: string;
};

function StatusPill({ status }: { status: Status }) {
  if (status === "Tout") return null;

  const bg =
    status === "En cours"
      ? "#E9F4FB"
      : status === "Livré"
        ? "#EAF7EE"
        : status === "Annulé"
          ? "#FCECEC"
          : "#EEF2F7";

  const fg =
    status === "En cours"
      ? colors.primary
      : status === "Livré"
        ? "#2E7D32"
        : status === "Annulé"
          ? "#D32F2F"
          : colors.text;

  const label =
    status === "En cours"
      ? "EN ATTENTE"
      : status === "Livré"
        ? "LIVRÉ"
        : status === "Annulé"
          ? "ANNULÉ"
          : status.toUpperCase();

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
        {label}
      </AppText>
    </View>
  );
}

function TypePill({ label }: { label: string }) {
  const safe = label.trim();
  if (!safe.length) return null;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        minHeight: 26,
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor: "#EEF2F7",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="dense" style={{ fontSize: 10, fontFamily: fonts.bodyBold, color: colors.text, letterSpacing: 0.6 }} numberOfLines={1}>
        {safe.toUpperCase()}
      </AppText>
    </View>
  );
}

function ModePill({ label }: { label: string }) {
  const safe = label.trim();
  if (!safe.length) return null;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        minHeight: 26,
        paddingVertical: 5,
        borderRadius: radii.pill,
        backgroundColor: "#E9F4FB",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText variant="dense" style={{ fontSize: 10, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.6 }} numberOfLines={1}>
        {safe.toUpperCase()}
      </AppText>
    </View>
  );
}

export default function TransactionCard({ item }: { item: TransactionCardItem }) {
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

  const ref = item.ref ?? `#AD-${item.id}`;
  const subtitle = [item.dateLabel, item.paymentLabel ?? item.quartier].filter(Boolean).join("  ·  ");
  const detailPath = item.typeLabel === "Expédition" ? `/expedition-detail/${item.id}` : `/livraison-detail/${item.id}`;

  return (
    <Pressable onPress={() => router.push(detailPath)} style={[card.base, { padding: 16 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 0, flex: 1, paddingRight: 10 }}>
          <AppText
            variant="dense"
            style={{ fontSize: 11, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.55)", letterSpacing: 0.4 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            REF {ref}
          </AppText>
          {item.typeLabel ? <TypePill label={item.typeLabel} /> : null}
          {item.modeLabel ? <ModePill label={item.modeLabel} /> : null}
        </View>
        <StatusPill status={item.status} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 }}>
          <SolarIcon name={iconName} size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
          <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 20 }} numberOfLines={2} ellipsizeMode="tail">
            {item.title}
          </AppText>
          <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 11, lineHeight: 16, marginTop: 3 }} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </AppText>
        </View>

        <View style={{ flexShrink: 0, alignItems: "flex-end" }}>
          <AppText style={{ fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text, lineHeight: 22 }} numberOfLines={1}>
            {item.amountLabel}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

