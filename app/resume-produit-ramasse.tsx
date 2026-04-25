import { useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, Phone, PackageOpen, Wallet, Zap } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticSuccess } from "@/lib/haptics";
import { isExpeditionService, parseExpeditionClient } from "@/lib/expeditionClient";

type Params = {
  quartier?: string; // legacy
  deliveryAddress?: string;
  pickupPhone?: string;
  pickupAddress?: string; // ramassage address/quartier exact
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

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText
      variant="dense"
      style={{
        fontSize: 12,
        lineHeight: 16,
        fontFamily: fonts.bodyBold,
        color: "rgba(60,74,60,0.7)",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
      numberOfLines={2}
    >
      {children}
    </AppText>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
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

  return (
    <ScreenLayout>
      {/* Top app bar */}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 41, marginBottom: 18 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <AppText variant="dense" style={{ fontSize: 18, lineHeight: 28, fontFamily: fonts.bodySemi, color: "#0F172A" }} numberOfLines={1}>
            {forExpedition ? "Expédition" : "Livraison"}
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <AppText style={{ ...typography.screenTitle, fontSize: 30, lineHeight: 36 }} numberOfLines={2}>
        {forExpedition ? "Résumé expédition (ramassage)" : "Résumé produit ramassé"}
      </AppText>
      <AppText style={{ ...typography.subtitle, lineHeight: 24, marginTop: 10 }}>
        Vérifiez les informations avant de confirmer.
      </AppText>

      <ScrollView style={{ marginTop: 18 }} contentContainerStyle={{ gap: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {forExpedition && expeditionClient ? (
          <View>
            <SectionLabel>CLIENT EXPÉDITION</SectionLabel>
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
          <SectionLabel>{forExpedition ? "CONTACT RAMASSAGE" : "DESTINATAIRE"}</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <Phone size={18} color={"rgba(25,28,29,0.75)"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {phone || "—"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel>ADRESSE DE LIVRAISON</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={18} color={"rgba(25,28,29,0.75)"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {deliveryAddress || quartierLivraison || "—"}
                </AppText>
                <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={2}>
                  Yaoundé, Cameroun
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel>TYPE DE LIVRAISON</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <Zap size={18} color={"rgba(25,28,29,0.75)"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2}>
                  {express === "yes" ? "Express" : "Normal"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel>ADRESSE DE RAMASSAGE</SectionLabel>
          <Card>
            <Line label="Adresse / quartier exact" value={ramassageAddress || "—"} />
          </Card>
        </View>

        <View>
          <SectionLabel>ARTICLE</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <PackageOpen size={18} color={"rgba(25,28,29,0.75)"} />
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
          <SectionLabel>PAIEMENT</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={18} color={"rgba(25,28,29,0.75)"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2}>
                  {paymentLine}
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Fixed action bar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 1,
          borderTopColor: "#EDEEEF",
          backgroundColor: "rgba(255,255,255,0.92)",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        <Pressable
          onPress={async () => {
            await hapticSuccess();
            router.push("/confirmee");
          }}
          style={{
            minHeight: 56,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            shadowColor: "#297FC6",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <AppText style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
            Confirmer la commande
          </AppText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

