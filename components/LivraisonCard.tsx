import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import SolarIcon from "./SolarIcon";
import AppText from "./AppText";
import { card, row } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

export type LivraisonOrder = {
  id: string;
  title: string;
  quartier: string;
  dateLabel: string;
  status: Status;
  amountLabel: string;
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

  return (
    <View
      style={{
        paddingHorizontal: 12,
        minHeight: 28,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        variant="dense"
        style={{ fontSize: 11, fontFamily: fonts.bodyBold, color: fg, letterSpacing: 0.6 }}
        numberOfLines={1}
      >
        {status.toUpperCase()}
      </AppText>
    </View>
  );
}

export default function LivraisonCard({ order }: { order: LivraisonOrder }) {
  const iconName = useMemo(() => {
    const t = String(order.title ?? "").toLowerCase();
    if (t.includes("vêt") || t.includes("vet")) return "solar:t-shirt-bold-duotone";
    if (t.includes("nourrit") || t.includes("panier") || t.includes("légume") || t.includes("legume") || t.includes("fruit")) return "solar:bag-bold-duotone";
    if (t.includes("iphone") || t.includes("électron") || t.includes("electron") || t.includes("smart")) return "solar:smartphone-bold-duotone";
    return "solar:box-bold-duotone";
  }, [order.title]);

  return (
    <Pressable
      onPress={() => router.push(`/livraison-detail/${order.id}`)}
      style={[card.base, { padding: 20 }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <SolarIcon name={iconName} size={32} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            {order.title}
          </AppText>
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {`${order.quartier} · ${order.dateLabel}`}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 12, flexShrink: 0 }}>
          <StatusPill status={order.status} />
          <SolarIcon name="solar:alt-arrow-right-outline" size={24} color={"rgba(60,74,60,0.55)"} />
        </View>
      </View>

      <View style={{ marginTop: 18, ...row.spaceBetween }}>
        <AppText style={{ fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
          {order.amountLabel}
        </AppText>
      </View>
    </Pressable>
  );
}
