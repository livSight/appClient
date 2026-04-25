import { useEffect, useMemo, useState } from "react";
import { Alert, View, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import SolarIcon from "../../components/SolarIcon";
import { card, row } from "../../theme/styles";
import { colors, fonts, radii, typography } from "../../theme/tokens";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import AppText from "../../components/AppText";

const WARNING_AMBER = "#F59E0B";

type Chip = { label: string; color: string; bg: string };

type DeliveryMode = "pickup" | "stock";
type DeliveryType = "express" | "normal";
type DeliveryItem = { name: string; qty: number };

type Delivery = {
  id: string;
  phone: string;
  mode: DeliveryMode;
  deliveryType: DeliveryType;
  pickupAddress?: string | null;
  items: DeliveryItem[];
  collectCash: boolean;
  amountDueXaf?: number | null;
  status?: string | null;
  quartier?: string | null;
  notes?: string | null;
  created_at?: string;
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "101",
    phone: "0612345678",
    mode: "pickup",
    deliveryType: "express",
    pickupAddress: "Bastos, face à la pharmacie",
    items: [{ name: "iPhone 15 Pro", qty: 1 }],
    collectCash: true,
    amountDueXaf: 50000,
    status: "pending",
    quartier: "Emombo",
    notes: "Appeler avant livraison.",
    created_at: new Date().toISOString(),
  },
  {
    id: "102",
    phone: "0698765432",
    mode: "stock",
    deliveryType: "normal",
    items: [
      { name: "Papier A4 (80g)", qty: 2 },
      { name: "Classeurs Rigides", qty: 1 },
    ],
    collectCash: false,
    amountDueXaf: null,
    status: "delivered",
    quartier: "Elig-Edzoa",
    notes: "Remettre au gardien.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "103",
    phone: "0700000000",
    mode: "pickup",
    deliveryType: "normal",
    pickupAddress: "Messassi, entrée principale",
    items: [{ name: "Colis divers", qty: 1 }],
    collectCash: true,
    amountDueXaf: 2500,
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
      color: colors.primary,
      bg: "#E0F2FE",
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
  if (state === "completed") return { iconName: "solar:check-circle-bold", color: colors.primary };
  if (state === "cancelled") return { iconName: "solar:close-circle-bold", color: "#D32F2F" };
  if (state === "warning") return { iconName: "solar:danger-circle-bold", color: WARNING_AMBER };
  if (state === "active") return { iconName: "solar:record-circle-bold", color: colors.primary };
  return { iconName: "solar:record-circle-bold", color: "#CBD5E1" };
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
            <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View
            style={{
              minHeight: 44,
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
          {/* Badges */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            <View
              style={{
                minHeight: 36,
                borderRadius: radii.pill,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: "rgba(14,165,233,0.10)",
                borderWidth: 1,
                borderColor: "rgba(14,165,233,0.20)",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SolarIcon name="solar:box-bold-duotone" size={24} color={colors.primary} />
              <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.4 }} numberOfLines={1}>
                {delivery.mode === "pickup" ? "PRODUIT RAMASSÉ" : "PRODUIT EN STOCK"}
              </AppText>
            </View>

            <View
              style={{
                minHeight: 36,
                borderRadius: radii.pill,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: "rgba(245,158,11,0.14)",
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.22)",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SolarIcon name="solar:lightning-bold-duotone" size={24} color={"#B45309"} />
              <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: "#92400E", letterSpacing: 0.4 }} numberOfLines={1}>
                {delivery.deliveryType === "express" ? "EXPRESS" : "NORMAL"}
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
          <View style={[card.base, { padding: 24 }]}>
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
                      <SolarIcon name={s1.iconName} size={18} color={s1.color} />
                      <Line active={timeline.step2 !== "upcoming"} />
                      <SolarIcon name={s2.iconName} size={18} color={s2.color} />
                      <Line active={timeline.step3 !== "upcoming"} />
                      <SolarIcon name={s3.iconName} size={18} color={s3.color} />
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
            {/* Pickup address (only for pickup mode) */}
            {delivery.mode === "pickup" ? (
              <View style={[card.base, { padding: 24 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <SolarIcon name="solar:map-point-outline" size={24} color={colors.primary} />
                  <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                    Adresse de ramassage
                  </AppText>
                </View>
                <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={3} ellipsizeMode="tail">
                  {delivery.pickupAddress?.trim() || "—"}
                </AppText>
              </View>
            ) : null}

            {/* Dropoff address */}
            <View style={[card.base, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <SolarIcon name="solar:map-point-outline" size={24} color={colors.primary} />
                <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Adresse de livraison
                </AppText>
              </View>
              <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={3} ellipsizeMode="tail">
                {delivery?.quartier?.trim() || "—"}
              </AppText>
            </View>

            {/* Articles */}
            <View style={[card.base, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <SolarIcon name="solar:bag-outline" size={24} color={colors.primary} />
                <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Articles
                </AppText>
              </View>
              <View style={{ gap: 12 }}>
                {(Array.isArray(delivery.items) ? delivery.items : []).map((it, idx) => (
                  <View key={`${it.name}-${idx}`} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                        {it.name}
                      </AppText>
                    </View>
                    <View style={{ flexShrink: 0 }}>
                      <View style={{ minHeight: 28, borderRadius: radii.pill, backgroundColor: "rgba(14,165,233,0.18)", paddingHorizontal: 10, paddingVertical: 6 }}>
                        <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                          x{it.qty}
                        </AppText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              {delivery?.notes?.trim() ? (
                <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 10 }} numberOfLines={4} ellipsizeMode="tail">
                  {delivery.notes.trim()}
                </AppText>
              ) : null}
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
              Paiement
            </AppText>
            <AppText style={{ fontSize: 22, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.white, marginTop: 10 }} numberOfLines={2} ellipsizeMode="tail">
              {delivery.collectCash
                ? `${(delivery.amountDueXaf ?? 0).toString()} XAF à récupérer`
                : "Pas d'argent à récupérer"}
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
                <SolarIcon name="solar:card-outline" size={24} color={colors.white} />
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
            <SolarIcon name="solar:question-circle-outline" size={24} color={colors.text} />
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
            <AppText style={{ ...typography.link, color: colors.primary }} numberOfLines={2} ellipsizeMode="tail">
              Annuler la livraison
            </AppText>
          </Pressable>
        </>
      )}
    </ScreenLayout>
  );
}

