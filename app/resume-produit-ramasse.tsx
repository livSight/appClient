import { useMemo } from "react";
import { Alert, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import FormButton from "../components/FormButton";
import SolarIcon from "../components/SolarIcon";
import CenteredScreenHeader from "../components/CenteredScreenHeader";
import { card } from "../theme/styles";
import { colors, fonts, typography } from "../theme/tokens";
import { hapticSuccess } from "@/lib/haptics";
import { isExpeditionService, parseExpeditionClient } from "@/lib/expeditionClient";
import { createTransaction } from "@/lib/api/deliveries";

type Params = {
  quartier?: string; // legacy
  deliveryAddress?: string;
  pickupPhone?: string;
  pickupAddress?: string;
  pickupPickupQuartier?: string;
  pickupPickupLandmark?: string;
  pickupDropoffQuartier?: string;
  pickupDropoffLandmark?: string;
  pickupExpress?: "yes" | "no";
  pickupName?: string;
  pickupQty?: string;
  pickupCollectCash?: "yes" | "no";
  pickupAmount?: string;
  service?: string;
  expeditionClient?: string;
};

function parseIntSafe(input: string | undefined): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d]/g, "");
  const n = cleaned.length ? Number(cleaned) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function SectionRow({ label, onEdit }: { label: string; onEdit?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText
          variant="dense"
          style={{
            fontSize: 12,
            lineHeight: 16,
            fontFamily: fonts.bodyBold,
            color: "rgba(60,74,60,0.7)",
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
          numberOfLines={2}
        >
          {label}
        </AppText>
      </View>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={10}>
          <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
            Modifier
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={[card.base, { padding: 20 }]}>{children}</View>;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingVertical: 6 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.75)" }} numberOfLines={2}>
          {label}
        </AppText>
      </View>
      <View style={{ flexShrink: 0, maxWidth: 220 }}>
        <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text, textAlign: "right" }} numberOfLines={2} ellipsizeMode="tail">
          {value}
        </AppText>
      </View>
    </View>
  );
}

export default function ResumeProduitRamasseScreen() {
  const params = useLocalSearchParams<Params>();

  const quartierLivraison = typeof params.quartier === "string" ? params.quartier : "";
  const deliveryAddress = typeof params.deliveryAddress === "string" ? params.deliveryAddress : "";
  const phone = typeof params.pickupPhone === "string" ? params.pickupPhone : "";
  const ramassageAddress = typeof params.pickupAddress === "string" ? params.pickupAddress : "";
  const pickupPickupQuartier = typeof params.pickupPickupQuartier === "string" ? params.pickupPickupQuartier : "";
  const pickupPickupLandmark = typeof params.pickupPickupLandmark === "string" ? params.pickupPickupLandmark : "";
  const pickupDropoffQuartier = typeof params.pickupDropoffQuartier === "string" ? params.pickupDropoffQuartier : "";
  const pickupDropoffLandmark = typeof params.pickupDropoffLandmark === "string" ? params.pickupDropoffLandmark : "";
  const express = params.pickupExpress === "yes" ? "yes" : "no";
  const itemName = typeof params.pickupName === "string" ? params.pickupName : "";
  const qty = parseIntSafe(typeof params.pickupQty === "string" ? params.pickupQty : "");
  const collectCash = params.pickupCollectCash === "yes" ? "yes" : "no";
  const amount = parseIntSafe(typeof params.pickupAmount === "string" ? params.pickupAmount : "");
  const forExpedition = isExpeditionService(typeof params.service === "string" ? params.service : undefined);
  const expeditionClient = useMemo(
    () => parseExpeditionClient(typeof params.expeditionClient === "string" ? params.expeditionClient : undefined),
    [params.expeditionClient]
  );

  const paymentLine = useMemo(() => {
    if (collectCash === "no") return "Pas d'argent à récupérer";
    return `${formatFcfa(amount)} FCFA à récupérer`;
  }, [amount, collectCash]);

  const phoneDisplay = useMemo(() => {
    const digits = phone.replace(/[^\d]/g, "");
    if (!digits.length) return "—";

    let local9 = digits;
    if (digits.length === 10 && digits.startsWith("0")) local9 = digits.slice(1);
    if (digits.length === 12 && digits.startsWith("237")) local9 = digits.slice(3);
    if (digits.length > 9) local9 = digits.slice(-9);

    if (local9.length === 9) {
      return `${local9.slice(0, 3)} ${local9.slice(3, 5)} ${local9.slice(5, 7)} ${local9.slice(7, 9)}`;
    }

    return phone.trim().length ? phone.trim() : digits;
  }, [phone]);

  const pickupAddressV2 = useMemo(() => {
    const q = pickupPickupQuartier.trim();
    const l = pickupPickupLandmark.trim();
    return [q, l].filter(Boolean).join(" — ") || ramassageAddress || "—";
  }, [pickupPickupQuartier, pickupPickupLandmark, ramassageAddress]);

  const dropoffAddressV2 = useMemo(() => {
    const q = pickupDropoffQuartier.trim();
    const l = pickupDropoffLandmark.trim();
    const v2 = [q, l].filter(Boolean).join(" — ");
    return v2 || deliveryAddress || quartierLivraison || "—";
  }, [pickupDropoffQuartier, pickupDropoffLandmark, deliveryAddress, quartierLivraison]);

  const deliveryFeeXaf = 1500;
  const expressSupplementXaf = express === "yes" ? 1000 : 0;
  const totalXaf = deliveryFeeXaf + expressSupplementXaf;

  function goEdit(editSection: string) {
    router.push({
      pathname: forExpedition ? "/ma-demande-expedition" : "/ma-demande-livraison",
      params: {
        mode: "pickup",
        editSection,
        ...(forExpedition
          ? {
              quartier: typeof params.quartier === "string" ? params.quartier : "",
              expeditionClient: typeof params.expeditionClient === "string" ? params.expeditionClient : "",
              pickupPhone: phone,
              pickupExpress: express,
              pickupCollectCash: collectCash,
              pickupAmount: typeof params.pickupAmount === "string" ? params.pickupAmount : "",
              pickupName: itemName,
              pickupQty: typeof params.pickupQty === "string" ? params.pickupQty : "",
              pickupPickupQuartier,
              pickupPickupLandmark,
              pickupDropoffQuartier,
              pickupDropoffLandmark,
              service: typeof params.service === "string" ? params.service : "",
            }
          : {
              pickupPhone: phone,
              pickupExpress: express,
              pickupCollectCash: collectCash,
              pickupAmount: typeof params.pickupAmount === "string" ? params.pickupAmount : "",
              pickupName: itemName,
              pickupQty: typeof params.pickupQty === "string" ? params.pickupQty : "",
              pickupPickupQuartier,
              pickupPickupLandmark,
              pickupDropoffQuartier,
              pickupDropoffLandmark,
            }),
      },
    });
  }

  return (
    <ScreenLayout
      header={
        <CenteredScreenHeader
          title={forExpedition ? "Résumé expédition (ramassage)" : "Résumé produit ramassé"}
          subtitle="Vérifiez les informations avant de confirmer"
          showBack
        />
      }
      footer={
        <View
          style={{
            backgroundColor: "transparent",
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <FormButton
            label="Confirmer la commande"
            onPress={async () => {
              await hapticSuccess();
              if (forExpedition) {
                const pickupStreet = pickupAddressV2.trim();
                const destinationStreet = dropoffAddressV2.trim() || "—";
                const descriptionToSend = pickupStreet ? `Ramassage: ${pickupStreet}` : "Aucune description donnée";

                try {
                  const created = await createTransaction({
                    package_name: itemName.trim().length ? itemName.trim() : "Colis",
                    description: descriptionToSend,
                    weight: null,
                    type: "expedition",
                    mode: "pickup",
                    express: express === "yes",
                    collect_cash: collectCash === "yes",
                    quantity: qty > 0 ? qty : 1,
                    receiver_phone: phone.trim(),
                    receiver_name: expeditionClient?.clientName?.trim() || undefined,
                    driver_id: 0,
                    agent_id: 0,
                    status: "pending",
                    transactionReference: "",
                    amount: collectCash === "yes" ? Math.max(0, Math.round(amount)) : 0,
                    departure_city: "Yaoundé",
                    departure_region: "Centre",
                    departure_street: pickupStreet || "—",
                    destination_city: "Yaoundé",
                    destination_region: "Centre",
                    destination_street: destinationStreet,
                  });
                  const createdId = created?.id ?? created?.data?.id;
                  router.push({
                    pathname: "/confirmee",
                    params: { id: createdId ? String(createdId) : "", flow: "expedition" },
                  });
                } catch (e: any) {
                  Alert.alert("Erreur", String(e?.message ?? e ?? "Impossible de créer l'expédition."));
                }
                return;
              }

              const amountDueNumber = collectCash === "yes" ? Math.max(0, Math.round(amount)) : 0;
              const amountDueFallback = Math.max(0, Math.round(totalXaf));
              const amountDueToSend = amountDueNumber > 0 ? amountDueNumber : amountDueFallback;

              try {
                const pickupStreet = pickupAddressV2.trim();
                const dropoffStreet = dropoffAddressV2.trim();
                const descriptionToSend = pickupStreet ? `Ramassage: ${pickupStreet}` : "Aucune description donnée";

                const created = await createTransaction({
                  package_name: itemName.trim().length ? itemName.trim() : "Colis",
                  description: descriptionToSend,
                  weight: null,
                  type: "pickup",
                  quantity: qty > 0 ? qty : 1,
                  receiver_phone: phone.trim(),
                  driver_id: 0,
                  agent_id: 0,
                  status: "pickup",
                  transactionReference: "",
                  amount: amountDueToSend,
                  departure_city: "Yaoundé",
                  departure_region: "Centre",
                  departure_street: pickupStreet || "—",
                  destination_city: "Yaoundé",
                  destination_region: "Centre",
                  destination_street: dropoffStreet || "—",
                });
                const createdId = created?.id ?? created?.data?.id;
                router.push({
                  pathname: "/confirmee",
                  params: { id: createdId ? String(createdId) : "" },
                });
              } catch (e: any) {
                Alert.alert("Erreur", String(e?.message ?? e ?? "Impossible de créer la livraison."));
              }
            }}
          />
        </View>
      }
    >
      <View style={{ gap: 18, marginTop: 8 }}>
        {forExpedition && expeditionClient ? (
          <View>
            <SectionRow label="CLIENT EXPÉDITION" />
            <Card>
              <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                {expeditionClient.clientName}
              </AppText>
              <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: colors.muted, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
                {expeditionClient.address}
              </AppText>
              {expeditionClient.phone ? (
                <AppText variant="dense" style={{ marginTop: 8, fontSize: 13, lineHeight: 18, fontFamily: fonts.bodyMedium, color: colors.text }} numberOfLines={1}>
                  {expeditionClient.phone}
                </AppText>
              ) : null}
            </Card>
          </View>
        ) : null}

        <View>
          <SectionRow label={forExpedition ? "CONTACT RAMASSAGE" : "DESTINATAIRE"} onEdit={() => goEdit("recipient")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                <SolarIcon name="solar:phone-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {phoneDisplay}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="ADRESSE DE LIVRAISON" onEdit={() => goEdit("deliveryAddress")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                <SolarIcon name="solar:map-point-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {dropoffAddressV2}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="TYPE DE LIVRAISON" onEdit={() => goEdit("deliveryType")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                {express === "yes" ? (
                  <SolarIcon name="solar:lightning-bold-duotone" size={24} color={colors.primary} />
                ) : (
                  <SolarIcon name="solar:clock-circle-outline" size={24} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2}>
                  {express === "yes" ? "Express" : "Normal"}
                </AppText>
                <AppText variant="dense" style={{ marginTop: 4, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={1}>
                  {express === "yes" ? "Livraison estimée sous 45 min" : "Livraison estimée sous 2h"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="MODE DE RÉCUPÉRATION" onEdit={() => goEdit("mode")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: "rgba(14,165,233,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(14,165,233,0.20)",
                }}
              >
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.6 }} numberOfLines={1}>
                  RAMASSAGE
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  Collecte à une adresse
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="ADRESSE DE RAMASSAGE" onEdit={() => goEdit("pickupAddress")} />
          <Card>
            <Line label="Adresse / quartier exact" value={pickupAddressV2} />
          </Card>
        </View>

        <View>
          <SectionRow label="ARTICLE" onEdit={() => goEdit("items")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                <SolarIcon name="solar:bag-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {itemName || "—"}
                </AppText>
                <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={1}>
                  {qty > 0 ? `Quantité: x${qty}` : "Quantité: —"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="PAIEMENT" onEdit={() => goEdit("payment")} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
                <SolarIcon name="solar:wallet-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2}>
                  {paymentLine}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionRow label="TOTAL" />
          <Card>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.85)" }} numberOfLines={1}>
                  Frais de livraison
                </AppText>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1}>
                  {deliveryFeeXaf.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA
                </AppText>
              </View>
              {expressSupplementXaf > 0 ? (
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.85)" }} numberOfLines={1}>
                    Supplément express
                  </AppText>
                  <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1}>
                    {expressSupplementXaf.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA
                  </AppText>
                </View>
              ) : null}
              <View style={{ height: 1, backgroundColor: "#EDEEEF", marginTop: 2 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 2 }}>
                <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  Total
                </AppText>
                <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  {totalXaf.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScreenLayout>
  );
}
