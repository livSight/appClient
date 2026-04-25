import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, MapPin, PackageOpen, Phone, Wallet, Zap, Clock } from "lucide-react-native";
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

function SectionRow({
  label,
  onEdit,
}: {
  label: string;
  onEdit?: () => void;
}) {
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
          numberOfLines={1}
          ellipsizeMode="tail"
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

function formatCmPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length !== 9) return "—";
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
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

  const phoneDisplay = useMemo(() => formatCmPhone(phone), [phone]);

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

  const deliveryFeeXaf = 1500;
  const expressSupplementXaf = express === "yes" ? 1000 : 0;
  const totalXaf = deliveryFeeXaf + expressSupplementXaf;

  function goEdit(editSection: string) {
    router.push({
      pathname: "/ma-demande-livraison",
      params: {
        mode: "stock",
        editSection,
        livPhone: phone,
        livExpress: express,
        livCollectCash: collectCash,
        livAmountDueText: amountDueText,
        livNotes: notes,
        deliveryQuartier,
        deliveryLandmark,
        stockItemId: items[0]?.id ?? "",
        stockQty: items[0]?.qty ? String(items[0].qty) : "",
      },
    });
  }

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center", marginBottom: 4 }}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            {forExpedition ? "Résumé expédition (stock)" : "Résumé produit en stock"}
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Vérifiez les informations avant de confirmer.
          </AppText>
        </View>
      }
      footer={
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#EDEEEF",
            backgroundColor: colors.white,
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 28,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 10,
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
            <SectionRow label="CLIENT EXPÉDITION" />
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
          <SectionRow label={forExpedition ? "CONTACT LIVRAISON" : "DESTINATAIRE"} onEdit={!forExpedition ? () => goEdit("recipient") : undefined} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                <Phone size={18} color={"rgba(25,28,29,0.75)"} />
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
          <SectionRow label="TYPE DE LIVRAISON" onEdit={!forExpedition ? () => goEdit("deliveryType") : undefined} />
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: "#F3F4F5", alignItems: "center", justifyContent: "center" }}>
                {express === "yes" ? <Zap size={18} color={"rgba(25,28,29,0.75)"} /> : <Clock size={18} color={"rgba(25,28,29,0.75)"} />}
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
          <SectionRow label="MODE DE RÉCUPÉRATION" onEdit={!forExpedition ? () => goEdit("mode") : undefined} />
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
          <SectionRow label="ARTICLES" onEdit={!forExpedition ? () => goEdit("items") : undefined} />
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
          <SectionRow label="ADRESSE DE LIVRAISON" onEdit={!forExpedition ? () => goEdit("address") : undefined} />
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
            <SectionRow label="AUTRES DÉTAILS / INSTRUCTIONS" onEdit={!forExpedition ? () => goEdit("notes") : undefined} />
            <Card>
              <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.9)" }}>
                {notes}
              </AppText>
            </Card>
          </View>
        ) : null}

        <View>
          <SectionRow label="PAIEMENT" onEdit={!forExpedition ? () => goEdit("payment") : undefined} />
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

        {!forExpedition ? (
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
        ) : null}
      </View>
    </ScreenLayout>
  );
}

