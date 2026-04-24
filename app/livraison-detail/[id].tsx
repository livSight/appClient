import { useEffect, useMemo, useState } from "react";
import { Alert, View, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
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
import { colors, fonts, radii, typography } from "../../theme/tokens";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import AppText from "../../components/AppText";

const WARNING_AMBER = "#F59E0B";

type Chip = { label: string; color: string; bg: string };

type Delivery = {
  id: string;
  phone: string;
  customer_name?: string | null;
  items: string;
  amount_due: number;
  status?: string | null;
  quartier?: string | null;
  notes?: string | null;
  created_at?: string;
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "101",
    phone: "0612345678",
    customer_name: "Marie",
    items: "Panier de légumes bio",
    amount_due: 4000,
    status: "pending",
    quartier: "Emombo",
    notes: "Appeler avant livraison.",
    created_at: new Date().toISOString(),
  },
  {
    id: "102",
    phone: "0698765432",
    customer_name: "Jean",
    items: "Chaussures x2",
    amount_due: 15000,
    status: "delivered",
    quartier: "Elig-Edzoa",
    notes: "Remettre au gardien.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "103",
    phone: "0700000000",
    customer_name: null,
    items: "Colis divers",
    amount_due: 2500,
    status: "cancelled",
    quartier: "Essomba",
    notes: null,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

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

type StatusFilter = "EN COURS" | "LIVRÉ" | "AU BUREAU" | "PROBLÈME" | "ANNULÉ";

const chipToListFilter: Record<StatusFilter, string> = {
  "EN COURS": "En cours",
  "LIVRÉ": "Livré",
  "AU BUREAU": "En cours",
  "PROBLÈME": "En cours",
  "ANNULÉ": "Annulé",
};

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: StatusFilter;
  active: boolean;
  onPress: () => void;
}) {
  const bg = active ? colors.primary : "#E9E9EA";
  const fg = active ? colors.white : colors.text;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={{
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        variant="dense"
        style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: fg, letterSpacing: 0.6 }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default function LivraisonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    if (!id) {
      setDelivery(null);
      return;
    }
    const found = MOCK_DELIVERIES.find((d) => d.id === String(id)) ?? null;
    setDelivery(found);
  }, [id]);

  const statusChip = useMemo(() => mapBackendStatusToChip(delivery?.status), [delivery?.status]);
  const timeline = useMemo(() => mapBackendStatusToTimeline(delivery?.status), [delivery?.status]);

  return (
    <ScreenLayout
      header={
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: 8, marginBottom: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
            <AppText variant="dense" style={{ ...typography.bodyRegular, fontFamily: fonts.bodySemi }} numberOfLines={1}>
              Detail de Livraison
            </AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>
      }
    >

      {!delivery ? (
        <View style={{ paddingVertical: 16 }}>
          <AppText style={{ color: "#D32F2F", fontFamily: fonts.bodySemi, marginBottom: 12 }}>
            Livraison introuvable (mock)
          </AppText>
        </View>
      ) : (
        <>
          {/* Order header */}
          <View style={[row.spaceBetween, { marginBottom: 18 }]}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <AppText style={{ fontSize: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                {delivery?.customer_name?.trim() || delivery?.items?.trim() || delivery?.phone || `#${id}`}
              </AppText>
            </View>
            <View
              style={{
                minHeight: 48,
                borderRadius: radii.pill,
                paddingHorizontal: 16,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: statusChip.bg,
              }}
            >
              <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: statusChip.color, letterSpacing: 0.6 }} numberOfLines={1}>
                {statusChip.label}
              </AppText>
            </View>
          </View>

          {/* Status filters — tap to navigate to list filtered by that status */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 12, paddingBottom: 6, marginBottom: 12 }}
          >
            {(["EN COURS", "LIVRÉ", "AU BUREAU", "PROBLÈME", "ANNULÉ"] as StatusFilter[]).map((label) => (
              <FilterChip
                key={label}
                label={label}
                active={statusChip.label === label}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/livraison",
                    params: { filter: chipToListFilter[label] },
                  })
                }
              />
            ))}
          </ScrollView>

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
                  <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                    Commande confirmée
                  </AppText>
                  <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }} numberOfLines={2} ellipsizeMode="tail">
                    {delivery?.created_at ? new Date(delivery.created_at).toLocaleString("fr-FR") : "Aujourd'hui, 14:20"}
                  </AppText>
                </View>
                <View>
                  <AppText
                    style={{
                      fontSize: 14,
                      fontFamily: fonts.bodyBold,
                      color:
                        timeline.step2 === "warning"
                          ? WARNING_AMBER
                          : timeline.step2 === "cancelled"
                            ? "#D32F2F"
                            : colors.primary,
                    }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    En cours de livraison
                  </AppText>
                  <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                    Le livreur est en route.
                  </AppText>
                  {timeline.step2 === "warning" && timeline.step2Helper ? (
                    <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6, color: WARNING_AMBER }}>
                      {timeline.step2Helper}
                    </AppText>
                  ) : null}
                  {timeline.step2 === "cancelled" && timeline.step2Helper ? (
                    <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6, color: "#D32F2F" }}>
                      {timeline.step2Helper}
                    </AppText>
                  ) : null}
                </View>
                <View>
                  <AppText
                    style={{
                      fontSize: 14,
                      fontFamily: fonts.bodyBold,
                      color: timeline.step3 === "active" ? "#2E7D32" : "#94A3B8",
                    }}
                    numberOfLines={1}
                  >
                    Colis livré
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* Summary & details */}
          <View style={{ marginTop: 18, gap: 16 }}>
            <View style={[card.outlined, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <ClipboardList size={18} color={colors.primary} />
                <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Contenu
                </AppText>
              </View>
              <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={3} ellipsizeMode="tail">
                {delivery?.items?.trim() || "Colis divers"}
              </AppText>
              <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6 }} numberOfLines={4} ellipsizeMode="tail">
                {delivery?.notes?.trim() || "A manipuler avec précaution, le colis est très fragile"}
              </AppText>
            </View>

            <View style={[card.outlined, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <MapPin size={18} color={colors.primary} />
                <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Zone de livraison
                </AppText>
              </View>
              <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={3} ellipsizeMode="tail">
                {delivery?.quartier?.trim() || "Tradex Emana, Yaoundé"}
              </AppText>
              <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 6 }} numberOfLines={2} ellipsizeMode="tail">
                Rue Al Fourat, Imm 42
              </AppText>
              <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 4 }} numberOfLines={3} ellipsizeMode="tail">
                Note: Sonner à l&apos;interphone B
              </AppText>
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
            <AppText variant="dense" style={{ ...typography.label, color: colors.white, opacity: 0.9 }} numberOfLines={2} ellipsizeMode="tail">
              Montant total à régler
            </AppText>
            <AppText style={{ fontSize: 32, fontFamily: fonts.bodyBold, color: colors.white, marginTop: 10 }} numberOfLines={1} ellipsizeMode="tail">
              {(delivery?.amount_due ?? 4000).toString()} XAF
            </AppText>

            <View style={{ marginTop: 14, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  minHeight: 36,
                  borderRadius: radii.pill,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                <CreditCard size={16} color={colors.white} />
                <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
                  Paiement à la livraison
                </AppText>
              </View>
            </View>
          </View>

          <Pressable
            style={{
              marginTop: 16,
              minHeight: 56,
              borderRadius: radii.pill,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              paddingVertical: 14,
            }}
          >
            <CircleHelp size={18} color={colors.text} />
            <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold }} numberOfLines={2} ellipsizeMode="tail">
              Besoin d&apos;aide ?
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => {
              void hapticLight();
              Alert.alert("Annuler la livraison ?", "Voulez-vous annuler cette livraison (UI-only) ?", [
                { text: "Retour", style: "cancel" },
                {
                  text: "Annuler",
                  style: "destructive",
                  onPress: async () => {
                    await hapticSuccess();
                    router.replace("/livraison");
                  },
                },
              ]);
            }}
            style={{ marginTop: 18, alignItems: "center" }}
          >
            <AppText style={{ ...typography.link, color: "#2563EB" }} numberOfLines={2} ellipsizeMode="tail">
              Annuler la livraison
            </AppText>
          </Pressable>
        </>
      )}
    </ScreenLayout>
  );
}

