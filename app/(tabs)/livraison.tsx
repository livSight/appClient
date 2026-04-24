import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { Package2 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import { card, row } from "../../theme/styles";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

type Order = {
  id: string;
  title: string;
  dateLabel: string;
  status: Status;
  amountLabel: string;
};

const MOCK_ORDERS: Order[] = [
  {
    id: "101",
    title: "Panier de légumes bio",
    dateLabel: "Aujourd'hui, 12:45",
    status: "En cours",
    amountLabel: "4 000 FCFA",
  },
  {
    id: "102",
    title: "Chaussures x2",
    dateLabel: "01 avr. 2026, 10:10",
    status: "Livré",
    amountLabel: "15 000 FCFA",
  },
  {
    id: "103",
    title: "Colis divers",
    dateLabel: "28 mars 2026, 18:20",
    status: "Annulé",
    amountLabel: "2 500 FCFA",
  },
];

function Chip({ label, active }: { label: Status; active?: boolean }) {
  return (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: active ? colors.primary : "#E9E9EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        variant="dense"
        style={{
          ...(typography.bodyRegular as object),
          fontFamily: fonts.bodySemi,
          color: active ? colors.white : colors.text,
        }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

function StatusPill({ status }: { status: Status }) {
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

function OrderCard({ order }: { order: Order }) {
  return (
    <View style={[card.outlined, { padding: 20 }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "#F1F3F5",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Package2 size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
            {order.title}
          </AppText>
          <AppText
            variant="dense"
            style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {order.dateLabel}
          </AppText>
        </View>

        <StatusPill status={order.status} />
      </View>

      <View style={{ marginTop: 18, ...row.spaceBetween }}>
        <View>
          <AppText variant="dense" style={{ fontSize: 11, letterSpacing: 1.2, color: "#8A8F98", fontFamily: fonts.bodyBold }} numberOfLines={1}>
            MONTANT
          </AppText>
          <AppText style={{ fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginTop: 4 }} numberOfLines={1} ellipsizeMode="tail">
            {order.amountLabel}
          </AppText>
        </View>

        <Pressable
          onPress={() => router.push(`/livraison-detail/${order.id}`)}
          style={{
            minHeight: 36,
            paddingHorizontal: 22,
            paddingVertical: 8,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText variant="dense" style={{ color: colors.white, fontFamily: fonts.bodyBold }} numberOfLines={1}>
            Details
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export default function LivraisonScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [active, setActive] = useState<Status>(() => {
    if (filter === "En cours") return "En cours";
    if (filter === "Livré") return "Livré";
    if (filter === "Annulé") return "Annulé";
    return "Tout";
  });
  const orders = useMemo(() => {
    if (active === "Tout") return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => o.status === active);
  }, [active]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Mes Livraisons
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Consultez toutes vos livraisons
          </AppText>
        </View>
      }
    >

      <View style={{ flexDirection: "row", gap: 12, marginBottom: spacing.sectionGap / 2 }}>
        <Pressable onPress={() => setActive("Tout")}>
          <Chip label="Tout" active={active === "Tout"} />
        </Pressable>
        <Pressable onPress={() => setActive("En cours")}>
          <Chip label="En cours" active={active === "En cours"} />
        </Pressable>
        <Pressable onPress={() => setActive("Livré")}>
          <Chip label="Livré" active={active === "Livré"} />
        </Pressable>
        <Pressable onPress={() => setActive("Annulé")}>
          <Chip label="Annulé" active={active === "Annulé"} />
        </Pressable>
      </View>

      <View style={{ marginBottom: spacing.sectionGap / 2 }}>
        <Pressable
          onPress={() => router.push("/livraison-zone")}
          style={{
            minHeight: 56,
            paddingVertical: 14,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
            Demander une nouvelle livraison
          </AppText>
        </Pressable>
      </View>

      <View style={{ gap: 24, paddingBottom: 8 }}>
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </View>
    </ScreenLayout>
  );
}

