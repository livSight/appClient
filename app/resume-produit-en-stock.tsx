import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, PackageOpen, Phone, Wallet, Zap } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import FormButton from "../components/FormButton";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticSuccess } from "@/lib/haptics";
import { isExpeditionService, parseExpeditionClient } from "@/lib/expeditionClient";

type SelectedItem = { id: string; name: string; qty: number };

type Params = {
  quartier?: string; // legacy
  deliveryAddress?: string;
  deliveryQuartier?: string;
  deliveryLandmark?: string;
  selectedItems?: string; // JSON string of SelectedItem[]
  phone?: string;
  notes?: string;
  express?: "yes" | "no";
  collectCash?: "yes" | "no";
  amountDueText?: string;
  service?: string;
  expeditionClient?: string;
};

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
      numberOfLines={1}
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

export default function ResumeProduitEnStockScreen() {
  const params = useLocalSearchParams<Params>();
  const quartier = typeof params.quartier === "string" ? params.quartier : "";
  const deliveryAddress = typeof params.deliveryAddress === "string" ? params.deliveryAddress : "";
  const deliveryQuartier = typeof params.deliveryQuartier === "string" ? params.deliveryQuartier : "";
  const deliveryLandmark = typeof params.deliveryLandmark === "string" ? params.deliveryLandmark : "";
  const selectedItemsRaw = typeof params.selectedItems === "string" ? params.selectedItems : "[]";
  const phone = typeof params.phone === "string" ? params.phone : "";
  const notes = typeof params.notes === "string" ? params.notes : "";
  const express = params.express === "yes" ? "yes" : "no";
  const collectCash = params.collectCash === "yes" ? "yes" : "no";
  const amountDueText = typeof params.amountDueText === "string" ? params.amountDueText : "";
  const forExpedition = isExpeditionService(typeof params.service === "string" ? params.service : undefined);
  const expeditionClient = useMemo(
    () => parseExpeditionClient(typeof params.expeditionClient === "string" ? params.expeditionClient : undefined),
    [params.expeditionClient]
  );

  const amountDue = useMemo(() => {
    const cleaned = amountDueText.replace(/[^\d.,]/g, "").replace(",", ".");
    const n = cleaned.length ? Number(cleaned) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }, [amountDueText]);

  const items = useMemo<SelectedItem[]>(() => {
    try {
      const parsed = JSON.parse(selectedItemsRaw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((it) => ({
          id: String(it?.id ?? ""),
          name: String(it?.name ?? ""),
          qty: Number.isFinite(Number(it?.qty)) ? Number(it.qty) : 0,
        }))
        .filter((it) => it.id && it.name && it.qty > 0);
    } catch {
      return [];
    }
  }, [selectedItemsRaw]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", minHeight: 44 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center", marginRight: 10 }}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodySemi, color: "rgba(15,23,42,0.8)" }} numberOfLines={1}>
                {forExpedition ? "Expédition" : "Livraison"}
              </AppText>
              <AppText style={{ ...typography.screenTitle, fontSize: 26, lineHeight: 30, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">
                {forExpedition ? "Résumé expédition (stock)" : "Résumé produit en stock"}
              </AppText>
              <AppText style={{ ...typography.subtitle, lineHeight: 22, marginTop: 6 }} numberOfLines={2} ellipsizeMode="tail">
                Veuillez vérifier les détails de votre{"\n"}commande avant de confirmer.
              </AppText>
            </View>
          </View>
        </View>
      }
      footer={
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#EDEEEF",
            backgroundColor: "rgba(255,255,255,0.95)",
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <FormButton
            label="Confirmer la commande"
            onPress={async () => {
              await hapticSuccess();
              router.push("/confirmee");
            }}
          />
        </View>
      }
    >
      <View style={{ marginTop: 18, gap: 18 }}>
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
            </Card>
          </View>
        ) : null}

        <View>
          <SectionLabel>{forExpedition ? "CONTACT LIVRAISON" : "DESTINATAIRE"}</SectionLabel>
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
          <SectionLabel>MODE DE RÉCUPÉRATION</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                  backgroundColor: "rgba(41,127,198,0.10)",
                  borderWidth: 1,
                  borderColor: "rgba(41,127,198,0.20)",
                }}
              >
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.6 }} numberOfLines={1}>
                  EN STOCK
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  Agence | Ongola Express
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel>ARTICLES</SectionLabel>
          <Card>
            {items.length ? (
              <View style={{ gap: 10 }}>
                {items.map((it) => (
                  <View key={it.id} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                      <PackageOpen size={18} color={"rgba(25,28,29,0.75)"} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                        {it.name}
                      </AppText>
                    </View>
                    <View style={{ flexShrink: 0 }}>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: "rgba(48,144,192,0.18)" }}>
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                          x{it.qty}
                        </AppText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                Aucun article sélectionné.
              </AppText>
            )}
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
                  {deliveryQuartier || deliveryAddress || quartier || "—"}
                </AppText>
                {deliveryLandmark.trim().length ? (
                  <AppText variant="dense" style={{ marginTop: 4, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={2} ellipsizeMode="tail">
                    {deliveryLandmark}
                  </AppText>
                ) : null}
              </View>
            </View>
          </Card>
        </View>

        {notes.trim().length ? (
          <View>
            <SectionLabel>AUTRES DÉTAILS / INSTRUCTIONS</SectionLabel>
            <Card>
              <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.9)" }}>
                {notes}
              </AppText>
            </Card>
          </View>
        ) : null}

        <View>
          <SectionLabel>PAIEMENT</SectionLabel>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <Wallet size={18} color={"rgba(25,28,29,0.75)"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2}>
                  {collectCash === "no"
                    ? "Pas d'argent à récupérer"
                    : Number.isFinite(amountDue) && amountDue > 0
                      ? `${Math.round(amountDue).toLocaleString("fr-FR").replace(/\\s/g, " ")} FCFA à récupérer`
                      : "Montant à récupérer"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>
      </View>
    </ScreenLayout>
  );
}

