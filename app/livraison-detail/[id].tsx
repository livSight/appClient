import { useEffect, useMemo, useState } from "react";
import { Alert, View, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import { FontAwesome } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import SolarIcon from "../../components/SolarIcon";
import LivraisonDetailHeader from "../../components/LivraisonDetailHeader";
import { card } from "../../theme/styles";
import { colors, fonts, radii, typography } from "../../theme/tokens";
import { hapticLight } from "@/lib/haptics";
import AppText from "../../components/AppText";
import { getTransactionById, type Transaction } from "@/lib/api/deliveries";

const WARNING_AMBER = "#F59E0B";

type Chip = { label: string; color: string; bg: string };

type DeliveryMode = "pickup" | "stock";
type DeliveryType = "express" | "normal";
type DeliveryItem = { name: string; qty: number };

type Delivery = {
  id: string;
  reference?: string | null;
  phone: string;
  mode: DeliveryMode;
  deliveryType: DeliveryType;
  pickupAddress?: string | null;
  items: DeliveryItem[];
  collectCash: boolean;
  amountDueXaf?: number | null;
  status?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  created_at?: string;
};

function mapTransactionToDelivery(tx: Transaction): Delivery {
  const id = String(tx.id ?? "");
  const reference = typeof tx.transactionReference === "string" && tx.transactionReference.trim().length ? tx.transactionReference.trim() : null;
  const phone = typeof tx.receiver?.phone === "string" && tx.receiver.phone.trim().length ? tx.receiver.phone.trim() : String(tx.receiver_phone ?? "");
  const qty = Number.isFinite(Number(tx.quantity)) ? Math.max(1, Math.floor(Number(tx.quantity))) : 1;
  const packageName = String(tx.package_name ?? "Colis");
  const mode: DeliveryMode = String(tx.type ?? "").toLowerCase() === "pickup" ? "pickup" : "stock";
  const pickupAddress =
    mode === "pickup"
      ? (typeof tx.departure?.street === "string" && tx.departure.street.trim().length
          ? tx.departure.street.trim()
          : typeof tx.departure_street === "string"
            ? tx.departure_street
            : null)
      : null;
  const destinationStreet =
    typeof tx.destination?.street === "string" && tx.destination.street.trim().length
      ? tx.destination.street.trim()
      : typeof tx.destination_street === "string"
        ? tx.destination_street.trim()
        : "";
  const deliveryAddress = destinationStreet.length ? destinationStreet : null;
  const notes = typeof tx.description === "string" ? tx.description : null;
  const amount = Number(tx.amount ?? 0);
  const collectCash = amount > 0;

  return {
    id,
    reference,
    phone,
    mode,
    deliveryType: "normal",
    pickupAddress,
    items: [{ name: packageName, qty }],
    collectCash,
    amountDueXaf: Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : null,
    status: typeof tx.status === "string" ? tx.status : null,
    deliveryAddress,
    notes,
    created_at: typeof tx.created_at === "string" ? tx.created_at : undefined,
  };
}

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function toE164Cameroon(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  const onlyDigits = digits.replace(/[^\d]/g, "");
  if (onlyDigits.length === 9 && (onlyDigits.startsWith("6") || onlyDigits.startsWith("7"))) {
    return `+237${onlyDigits}`;
  }
  if (onlyDigits.length >= 10) return `+${onlyDigits}`;
  return null;
}

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
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setDelivery(null);
      setLoadError(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const tx = await getTransactionById(String(id));
        if (!mounted) return;
        setDelivery(mapTransactionToDelivery(tx));
      } catch (e: any) {
        if (!mounted) return;
        setDelivery(null);
        setLoadError(String(e?.message ?? e ?? "Impossible de charger la livraison."));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const statusChip = useMemo(() => mapBackendStatusToChip(delivery?.status), [delivery?.status]);
  const timeline = useMemo(() => mapBackendStatusToTimeline(delivery?.status), [delivery?.status]);
  const referenceTitle = useMemo(() => {
    if (!delivery) return null;
    return delivery.reference ? delivery.reference : `TR-${delivery.id}`;
  }, [delivery]);
  const createdLabel = useMemo(() => {
    const iso = delivery?.created_at;
    if (!iso) return "Effectuée —";
    try {
      return `Effectuée le ${new Date(iso).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`;
    } catch {
      return "Effectuée —";
    }
  }, [delivery?.created_at]);

  const txDetails = useMemo(() => {
    if (!delivery) return null;
    const deliveryFeeXaf = 1500;
    const expressFeeXaf = delivery.deliveryType === "express" ? 1000 : 0;
    const itemCostXafBase = typeof delivery.amountDueXaf === "number" ? delivery.amountDueXaf : 0;
    const itemCostXaf = itemCostXafBase > 0 ? itemCostXafBase : 10000;
    const totalXaf = itemCostXaf + deliveryFeeXaf + expressFeeXaf;
    const paymentMethod = delivery.collectCash ? "Paiement en espèce" : "Mobile Money";
    const serviceType = `Livraison ${delivery.deliveryType === "express" ? "Express" : "Normal"}`;
    const expressLine = delivery.deliveryType === "express" ? `Oui | ${formatFcfa(expressFeeXaf)} F` : "Non";
    const stocked = delivery.mode === "stock" ? "Oui" : "Non";
    return {
      totalXaf,
      paymentMethod,
      serviceType,
      zone: delivery.deliveryAddress?.split("—")[0]?.trim() || "—",
      deliveryFeeXaf,
      itemCostXaf,
      expressLine,
      stocked,
    };
  }, [delivery]);

  return (
    <ScreenLayout
      header={
        <LivraisonDetailHeader
          referenceLabel={referenceTitle}
        />
      }
    >

      {!delivery ? (
        <View style={{ paddingVertical: 16 }}>
          <AppText style={{ color: "#D32F2F", fontFamily: fonts.bodySemi, marginBottom: 12 }}>
            {loading ? "Chargement…" : loadError ? loadError : "Livraison introuvable"}
          </AppText>
          {!loading && loadError ? (
            <Pressable
              onPress={() => {
                if (!id) return;
                void hapticLight();
                router.replace({ pathname: "/livraison-detail/[id]", params: { id: String(id) } });
              }}
              style={{
                minHeight: 48,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                alignSelf: "flex-start",
              }}
            >
              <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.white, letterSpacing: 0.6 }} numberOfLines={1}>
                Réessayer
              </AppText>
            </Pressable>
          ) : null}
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

            <View
              style={{
                minHeight: 36,
                borderRadius: radii.pill,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: statusChip.bg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: statusChip.color, letterSpacing: 0.4 }} numberOfLines={1}>
                {statusChip.label}
              </AppText>
            </View>
          </View>

          {/* Status card */}
          <View style={[card.base, { padding: 24 }]}>
            {(() => {
              const s1 = iconForStep(timeline.step1);
              const s2 = iconForStep(timeline.step2);
              const s3 = iconForStep(timeline.step3);

              const steps = [
                {
                  key: "confirmed",
                  iconName: s1.iconName,
                  iconColor: s1.color,
                  title: "Commande confirmée",
                  subtitle: null as string | null,
                  helper: null as string | null,
                  titleColor: colors.text,
                  connectorActive: timeline.step2 !== "upcoming",
                },
                {
                  key: "in_progress",
                  iconName: s2.iconName,
                  iconColor: s2.color,
                  title: "En cours de livraison",
                  subtitle: "Le livreur est en route.",
                  helper:
                    timeline.step2 === "warning" || timeline.step2 === "cancelled"
                      ? (timeline.step2Helper ?? null)
                      : null,
                  titleColor:
                    timeline.step2 === "warning"
                      ? WARNING_AMBER
                      : timeline.step2 === "cancelled"
                        ? "#D32F2F"
                        : colors.primary,
                  helperColor: timeline.step2 === "warning" ? WARNING_AMBER : "#D32F2F",
                  connectorActive: timeline.step3 !== "upcoming",
                },
                {
                  key: "delivered",
                  iconName: s3.iconName,
                  iconColor: s3.color,
                  title: "Colis livré",
                  subtitle: null as string | null,
                  helper: null as string | null,
                  titleColor: timeline.step3 === "active" ? "#2E7D32" : "#94A3B8",
                  connectorActive: false,
                },
              ];

              return (
                <View style={{ gap: 14 }}>
                  {steps.map((step, idx) => {
                    const isLast = idx === steps.length - 1;
                    return (
                      <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View style={{ alignItems: "center", width: 18, marginRight: 14 }}>
                          <SolarIcon name={step.iconName} size={18} color={step.iconColor} />
                          {!isLast ? (
                            <View
                              style={{
                                width: 2,
                                flex: 1,
                                minHeight: 18,
                                marginTop: 8,
                                backgroundColor: step.connectorActive ? "#D1D5DB" : "#E5E7EB",
                              }}
                            />
                          ) : null}
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <AppText style={{ fontSize: 14, fontFamily: fonts.bodyBold, color: step.titleColor }} numberOfLines={2} ellipsizeMode="tail">
                            {step.title}
                          </AppText>

                          {step.subtitle ? (
                            <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
                              {step.subtitle}
                            </AppText>
                          ) : null}

                          {"helper" in step && step.helper ? (
                            <AppText
                              variant="dense"
                              style={{
                                ...typography.subtitle,
                                fontSize: 12,
                                lineHeight: 16,
                                marginTop: 6,
                                color: "helperColor" in step ? (step as any).helperColor : typography.subtitle.color,
                              }}
                            >
                              {step.helper}
                            </AppText>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>

          {/* Client */}
          <View style={{ marginTop: 16 }}>
            <View style={[card.base, { padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <SolarIcon name="solar:user-outline" size={24} color={colors.primary} />
                <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Client
                </AppText>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                    {delivery.phone}
                  </AppText>
                  <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
                    Contact client
                  </AppText>
                </View>

                <View style={{ flexDirection: "row", gap: 10, flexShrink: 0 }}>
                  <Pressable
                    onPress={() => {
                      const e164 = toE164Cameroon(delivery.phone);
                      void Linking.openURL(`tel:${e164 ?? delivery.phone}`);
                    }}
                    hitSlop={10}
                    style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    <SolarIcon name="solar:phone-outline" size={22} color={colors.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      const e164 = toE164Cameroon(delivery.phone);
                      const phone = (e164 ?? delivery.phone).replace(/[^\d]/g, "");
                      void Linking.openURL(`https://wa.me/${phone}`);
                    }}
                    hitSlop={10}
                    style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    <FontAwesome name="whatsapp" size={24} color={"#25D366"} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => {
                Alert.alert("Signaler un problème", "Signaler un problème avec cette livraison (UI-only).");
              }}
              style={{
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
              <SolarIcon name="solar:dialog-bold" size={24} color={colors.text} />
              <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold }} numberOfLines={2} ellipsizeMode="tail">
                Signaler un problème
              </AppText>
            </Pressable>
          </View>

          {/* Summary & details */}
          <View style={{ marginTop: 18, gap: 16 }}>
            {/* Détails */}
            {txDetails ? (
              <View style={[card.base, { padding: 24 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                    <AppText variant="dense" style={{ ...typography.label, color: "rgba(60,74,60,0.65)" }} numberOfLines={1}>
                      MONTANT TOTAL
                    </AppText>
                    <AppText style={{ fontSize: 34, lineHeight: 40, fontFamily: fonts.bodyBold, color: colors.text, marginTop: 8 }} numberOfLines={1}>
                      {formatFcfa(txDetails.totalXaf)}{" "}
                      <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                        FCFA
                      </AppText>
                    </AppText>
                  </View>
                </View>

                <View style={{ marginTop: 18, gap: 12 }}>
                  {[
                    { k: "Méthode de paiement", v: txDetails.paymentMethod },
                    { k: "Type de service", v: txDetails.serviceType },
                    { k: "Zone de livraison", v: txDetails.zone },
                    { k: "Frais de livraison", v: `${formatFcfa(txDetails.deliveryFeeXaf)} FCFA` },
                    { k: "Coût de l’article", v: `${formatFcfa(txDetails.itemCostXaf)} FCFA` },
                    { k: "Express", v: txDetails.expressLine },
                    { k: "Produit stocké", v: txDetails.stocked },
                    { k: "Date", v: createdLabel },
                  ].map((line) => (
                    <View key={line.k} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16 }} numberOfLines={2} ellipsizeMode="tail">
                          {line.k}
                        </AppText>
                      </View>
                      <View style={{ flexShrink: 0, maxWidth: 180 }}>
                        <AppText style={{ fontSize: 13, lineHeight: 18, fontFamily: fonts.bodySemi, color: colors.text, textAlign: "right" }} numberOfLines={2} ellipsizeMode="tail">
                          {line.v}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>

                {delivery.collectCash ? (
                  <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
                    <View
                      style={{
                        minHeight: 36,
                        borderRadius: radii.pill,
                        backgroundColor: "rgba(14,165,233,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(14,165,233,0.18)",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                      }}
                    >
                      <SolarIcon name="solar:card-outline" size={22} color={colors.primary} />
                      <AppText variant="dense" style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                        Paiement à la livraison
                      </AppText>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

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
                {delivery?.deliveryAddress?.trim() || "—"}
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

          <Pressable
            onPress={() => Alert.alert("Reçu PDF", "Télécharger le reçu (UI-only).")}
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
            hitSlop={10}
          >
            <SolarIcon name="solar:download-outline" size={22} color={colors.text} />
            <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold }} numberOfLines={2} ellipsizeMode="tail">
              Reçu PDF
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => {
              void hapticLight();
              router.push({
                pathname: "/annulation",
                params: { id: String(delivery.id) },
              });
            }}
            style={{
              marginTop: 18,
              minHeight: 56,
              borderRadius: radii.pill,
              backgroundColor: "#DC2626",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 14,
            }}
          >
            <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={2} ellipsizeMode="tail">
              Annuler la livraison
            </AppText>
          </Pressable>

        </>
      )}
    </ScreenLayout>
  );
}

