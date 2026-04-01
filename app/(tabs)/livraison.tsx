import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { ArrowLeft, Package2 } from "lucide-react-native";
import { router } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import { card, row } from "../../theme/styles";
import { colors, radii, spacing, typography } from "../../theme/tokens";
import { listVendorDeliveries, type VendorDelivery } from "@/lib/api/vendor";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

type Order = {
  id: string;
  title: string;
  dateLabel: string;
  status: Status;
  amountLabel: string;
};

function mapBackendStatusToUi(status: string): Status {
  if (status === "pending") return "En cours";
  if (status === "delivered") return "Livré";
  if (status === "failed" || status === "cancelled") return "Annulé";
  return "En cours";
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toOrder(delivery: VendorDelivery): Order {
  const title = delivery.customer_name?.trim()
    ? delivery.customer_name.trim()
    : delivery.items?.trim()
      ? delivery.items.trim()
      : delivery.phone;

  return {
    id: String(delivery.id),
    title,
    dateLabel: formatDateLabel(delivery.created_at),
    status: mapBackendStatusToUi(delivery.status),
    amountLabel: `${delivery.amount_due} FCFA`,
  };
}

function Chip({ label, active }: { label: Status; active?: boolean }) {
  return (
    <Pressable
      style={{
        height: 56,
        paddingHorizontal: 18,
        borderRadius: radii.pill,
        backgroundColor: active ? colors.primary : "#E9E9EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          ...(typography.bodyRegular as object),
          fontWeight: "600",
          color: active ? colors.white : colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
        height: 28,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: fg, letterSpacing: 0.6 }}>
        {status.toUpperCase()}
      </Text>
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

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
            {order.title}
          </Text>
          <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
            {order.dateLabel}
          </Text>
        </View>

        <StatusPill status={order.status} />
      </View>

      <View style={{ marginTop: 18, ...row.spaceBetween }}>
        <View>
          <Text style={{ fontSize: 11, letterSpacing: 1.2, color: "#8A8F98", fontWeight: "700" }}>
            MONTANT
          </Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 }}>
            {order.amountLabel}
          </Text>
        </View>

        <Pressable
          style={{
            height: 36,
            paddingHorizontal: 22,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "700" }}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function LivraisonScreen() {
  const [active, setActive] = useState<Status>("Tout");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<VendorDelivery[]>([]);

  const orders = useMemo(() => deliveries.map(toOrder), [deliveries]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const statusParam =
        active === "Tout"
          ? undefined
          : active === "En cours"
            ? "pending"
            : active === "Livré"
              ? "delivered"
              : "cancelled";

      const data = await listVendorDeliveries({
        page: 1,
        limit: 50,
        ...(statusParam ? { status: statusParam } : {}),
        sortBy: "created_at",
        sortOrder: "DESC",
      });
      setDeliveries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <ScreenLayout>
      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", height: 44, marginBottom: 8 }}>
        <Pressable style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color="#2ECC71" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Livraison</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Text style={{ ...typography.subtitle, marginBottom: 14 }}>
        Consultez toutes vos Livraisons
      </Text>

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
            height: 56,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={typography.buttonTextInverse}>Demander une nouvelle livraison</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
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
      ) : (
        <View style={{ gap: 24, paddingBottom: 8 }}>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}

