import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  CircleCheck,
  CircleDot,
  ClipboardList,
  MapPin,
  CircleHelp,
  CreditCard,
  CircleX,
} from "lucide-react-native";
import ScreenLayout from "../../components/ScreenLayout";
import { card, row } from "../../theme/styles";
import { colors, radii, typography } from "../../theme/tokens";
import { getDeliveryById, type VendorDelivery } from "@/lib/api/vendor";

const WARNING_AMBER = "#F59E0B";

type Chip = { label: string; color: string; bg: string };

function normalizeStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase();
}

function mapBackendStatusToChip(status?: string | null): Chip {
  const s = normalizeStatus(status);

  if (s === "delivered") return { label: "LIVRÉ", color: "#2E7D32", bg: "#EAF7EE" };
  if (s === "pickup")
    return {
      label: "AU BUREAU",
      color: "#2563EB",
      bg: "#E9F0FF",
    };
  if (s === "failed" || s === "cancelled") return { label: "ANNULÉ", color: "#D32F2F", bg: "#FCECEC" };

  // Issue / warning states
  if (
    s === "client_absent" ||
    s === "unreachable" ||
    s === "postponed" ||
    s === "no_answer" ||
    s === "present_ne_decroche_zone1" ||
    s === "present_ne_decroche_zone2"
  ) {
    return { label: "PROBLÈME", color: WARNING_AMBER, bg: "#FEF3C7" };
  }

  // Default / pending / unknown → in progress
  return { label: "EN COURS", color: colors.primary, bg: "#E9F4FB" };
}

type StepState = "completed" | "active" | "warning" | "cancelled" | "upcoming";
type Timeline = {
  step1: StepState;
  step2: StepState;
  step3: StepState;
  step2Helper?: string;
};

function mapBackendStatusToTimeline(status?: string | null): Timeline {
  const s = normalizeStatus(status);

  if (s === "delivered" || s === "pickup") {
    return { step1: "completed", step2: "completed", step3: "active" };
  }

  if (s === "failed" || s === "cancelled") {
    return { step1: "completed", step2: "cancelled", step3: "upcoming", step2Helper: "Livraison annulée." };
  }

  if (
    s === "client_absent" ||
    s === "unreachable" ||
    s === "postponed" ||
    s === "no_answer" ||
    s === "present_ne_decroche_zone1" ||
    s === "present_ne_decroche_zone2"
  ) {
    const helper =
      s === "client_absent"
        ? "Client absent, nouvelle tentative requise."
        : s === "unreachable"
          ? "Client injoignable."
          : s === "postponed"
            ? "Livraison reportée."
            : "Le client ne décroche pas.";

    return { step1: "completed", step2: "warning", step3: "upcoming", step2Helper: helper };
  }

  // pending + unknown statuses → in progress
  return { step1: "completed", step2: "active", step3: "upcoming" };
}

function iconForStep(state: StepState) {
  if (state === "completed") return { Icon: CircleCheck, color: colors.primary };
  if (state === "cancelled") return { Icon: CircleX, color: "#D32F2F" };
  if (state === "warning") return { Icon: CircleDot, color: WARNING_AMBER };
  if (state === "active") return { Icon: CircleDot, color: colors.primary };
  return { Icon: CircleDot, color: "#CBD5E1" };
}

export default function LivraisonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<VendorDelivery | null>(null);

  const statusChip = useMemo(() => mapBackendStatusToChip(delivery?.status), [delivery?.status]);
  const timeline = useMemo(() => mapBackendStatusToTimeline(delivery?.status), [delivery?.status]);

  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);
    try {
      if (!id) {
        setDelivery(null);
        setError("ID de livraison manquant");
        return;
      }
      const found = await getDeliveryById(id);
      setDelivery(found);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Focus-aware polling (every 10s) while the screen is visible.
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        void load();
      }, 10_000);
      return () => clearInterval(interval);
    }, [load])
  );

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={{ ...row.spaceBetween, height: 44, marginBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Detail de Livraison</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
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
        <>
          {/* Order header */}
          <View style={[row.spaceBetween, { marginBottom: 18 }]}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>
              {delivery?.customer_name?.trim() || delivery?.items?.trim() || delivery?.phone || `#${id}`}
            </Text>
            <View
              style={{
                height: 48,
                borderRadius: radii.pill,
                paddingHorizontal: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: statusChip.bg,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: statusChip.color, letterSpacing: 0.6 }}>
                {statusChip.label}
              </Text>
            </View>
          </View>

          {/* Status card */}
          <View style={[card.outlined, { padding: 24 }]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={{ alignItems: "center", marginRight: 14 }}>
                {(() => {
                  const s1 = iconForStep(timeline.step1);
                  const s2 = iconForStep(timeline.step2);
                  const s3 = iconForStep(timeline.step3);
                  const Line = ({ active }: { active: boolean }) => (
                    <View
                      style={{
                        width: 2,
                        height: 28,
                        backgroundColor: active ? "#D1D5DB" : "#E5E7EB",
                        marginVertical: 8,
                      }}
                    />
                  );
                  return (
                    <>
                      <s1.Icon size={18} color={s1.color} />
                      <Line active={timeline.step2 !== "upcoming"} />
                      <s2.Icon size={18} color={s2.color} />
                      <Line active={timeline.step3 !== "upcoming"} />
                      <s3.Icon size={18} color={s3.color} />
                    </>
                  );
                })()}
              </View>

              <View style={{ flex: 1, gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    Commande confirmée
                  </Text>
                  <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                    {delivery?.created_at ? new Date(delivery.created_at).toLocaleString("fr-FR") : "Aujourd'hui, 14:20"}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color:
                        timeline.step2 === "warning"
                          ? WARNING_AMBER
                          : timeline.step2 === "cancelled"
                            ? "#D32F2F"
                            : colors.primary,
                    }}
                  >
                    En cours de livraison
                  </Text>
                  <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                    Le livreur est en route.
                  </Text>
                  {timeline.step2 === "warning" && timeline.step2Helper ? (
                    <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6, color: WARNING_AMBER }}>
                      {timeline.step2Helper}
                    </Text>
                  ) : null}
                  {timeline.step2 === "cancelled" && timeline.step2Helper ? (
                    <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6, color: "#D32F2F" }}>
                      {timeline.step2Helper}
                    </Text>
                  ) : null}
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: timeline.step3 === "active" ? "#2E7D32" : "#94A3B8",
                    }}
                  >
                    Colis livré
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary & details */}
          <View style={{ marginTop: 18, gap: 16 }}>
            <View style={[card.outlined, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <ClipboardList size={18} color={colors.primary} />
                <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: "800", color: colors.text }}>
                  Contenu
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {delivery?.items?.trim() || "Colis divers"}
              </Text>
              <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6 }}>
                {delivery?.notes?.trim() || "A manipuler avec précaution, le colis est très fragile"}
              </Text>
            </View>

            <View style={[card.outlined, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <MapPin size={18} color={colors.primary} />
                <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: "800", color: colors.text }}>
                  Zone de livraison
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {delivery?.quartier?.trim() || "Tradex Emana, Yaoundé"}
              </Text>
              <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6 }}>
                Rue Al Fourat, Imm 42
              </Text>
              <Text style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 4 }}>
                Note: Sonner à l&apos;interphone B
              </Text>
            </View>
          </View>

          {/* Amount & payment */}
          <View
            style={{
              marginTop: 18,
              borderRadius: radii.card,
              backgroundColor: colors.primary,
              padding: 24,
              overflow: "hidden",
            }}
          >
            <Text style={{ ...typography.label, color: colors.white, opacity: 0.9 }}>
              Montant total à régler
            </Text>
            <Text style={{ fontSize: 32, fontWeight: "900", color: colors.white, marginTop: 10 }}>
              {(delivery?.amount_due ?? 4000).toString()} XAF
            </Text>

            <View style={{ marginTop: 14, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  height: 36,
                  borderRadius: radii.pill,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <CreditCard size={16} color={colors.white} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.white }}>
                  Paiement à la livraison
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={{
              marginTop: 16,
              height: 56,
              borderRadius: radii.pill,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
            }}
          >
            <CircleHelp size={18} color={colors.text} />
            <Text style={{ ...typography.bodyRegular, fontWeight: "700" }}>Besoin d&apos;aide ?</Text>
          </Pressable>

          <Pressable onPress={() => router.replace("/livraison")} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ ...typography.link, color: "#2563EB" }}>Annuler la livraison</Text>
          </Pressable>
        </>
      )}
    </ScreenLayout>
  );
}

