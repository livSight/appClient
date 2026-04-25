import { useMemo } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, MapPin, User, PackageOpen, ClipboardList } from "lucide-react-native";
import ScreenLayout from "../components/ScreenLayout";
import AppText from "../components/AppText";
import { colors, fonts, radii, typography } from "../theme/tokens";
import { hapticSuccess } from "@/lib/haptics";

type Mode = "stock" | "pickup";

type Params = {
  quartier?: string;
  mode?: Mode;
  selectedCount?: string;
  pickupName?: string;
  pickupAddress?: string;
  pickupQty?: string;
  pickupCollectCash?: "yes" | "no";
  pickupAmount?: string;
  pickupPhone?: string;
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

function Card({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
      {footer ? (
        <View style={{ borderTopWidth: 1, borderTopColor: "#F3F4F5", padding: 12 }}>{footer}</View>
      ) : null}
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
  right?: string;
  onPress?: () => void;
}) {
  const Icon = icon;
  const content = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {Icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            backgroundColor: "#F3F4F5",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={"rgba(25,28,29,0.75)"} />
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {right ? (
        <View style={{ flexShrink: 0 }}>
          <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
            {right}
          </AppText>
        </View>
      ) : null}

      {onPress ? (
        <View style={{ flexShrink: 0 }}>
          <ChevronRight size={18} color={"rgba(60,74,60,0.45)"} />
        </View>
      ) : null}
    </View>
  );

  return onPress ? (
    <Pressable onPress={onPress} hitSlop={10} style={{ paddingVertical: 4 }}>
      {content}
    </Pressable>
  ) : (
    <View style={{ paddingVertical: 4 }}>{content}</View>
  );
}

function parseXaf(input: string | undefined): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d]/g, "");
  const n = cleaned.length ? Number(cleaned) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

export default function RecapitulatifScreen() {
  const params = useLocalSearchParams<Params>();
  const mode: Mode = params.mode === "pickup" ? "pickup" : "stock";

  const quartier = typeof params.quartier === "string" ? params.quartier : "";
  const selectedCount = typeof params.selectedCount === "string" ? Number(params.selectedCount) : 0;

  const pickupName = typeof params.pickupName === "string" ? params.pickupName : "";
  const pickupAddress = typeof params.pickupAddress === "string" ? params.pickupAddress : "";
  const pickupQty = typeof params.pickupQty === "string" ? parseXaf(params.pickupQty) : 0;
  const pickupCollectCash = params.pickupCollectCash === "yes" ? "yes" : "no";
  const pickupAmount = typeof params.pickupAmount === "string" ? parseXaf(params.pickupAmount) : 0;
  const pickupPhone = typeof params.pickupPhone === "string" ? params.pickupPhone : "";

  const recapLines = useMemo(() => {
    if (mode === "pickup") {
      const cashLine =
        pickupCollectCash === "yes" ? `À récupérer: ${formatFcfa(pickupAmount)} FCFA` : "Pas d'argent à récupérer";
      return [
        { label: "Article", value: pickupName || "—" },
        { label: "Quantité", value: pickupQty > 0 ? `x${pickupQty}` : "—" },
        { label: "Ramassage", value: pickupAddress || quartier || "—" },
        { label: "Téléphone", value: pickupPhone || "—" },
        { label: "Paiement", value: cashLine },
      ];
    }
    return [{ label: "Articles", value: selectedCount > 0 ? `${selectedCount} article(s)` : "—" }];
  }, [mode, pickupAddress, pickupAmount, pickupCollectCash, pickupName, pickupPhone, pickupQty, quartier, selectedCount]);

  return (
    <ScreenLayout>
      {/* Top app bar */}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 41, marginBottom: 18 }}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <AppText variant="dense" style={{ fontSize: 18, lineHeight: 28, fontFamily: fonts.bodySemi, color: "#0F172A" }} numberOfLines={1}>
            Livraison
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <AppText style={{ ...typography.screenTitle, fontSize: 30, lineHeight: 36 }} numberOfLines={2}>
        Résumé de la demande
      </AppText>
      <AppText style={{ ...typography.subtitle, lineHeight: 24, marginTop: 10 }}>
        Veuillez vérifier les détails de votre{"\n"}commande avant de confirmer.
      </AppText>

      <ScrollView
        style={{ marginTop: 18 }}
        contentContainerStyle={{ gap: 18, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <SectionLabel>DESTINATAIRE</SectionLabel>
          <Card>
            <Row icon={User} title={"Jean Dupont"} subtitle={"+237 698514525"} />
          </Card>
        </View>

        <View>
          <SectionLabel>TYPE</SectionLabel>
          <Card>
            <Row title={"Livraison Express"} subtitle={"Priorité absolue · Livraison en 30 min – 1h"} />
            <Row title={"Autre:"} subtitle={"—"} />
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
                  {mode === "pickup" ? "RAMASSAGE" : "EN STOCK"}
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  {mode === "pickup" ? "Adresse de ramassage" : "Agence | Ongola Express"}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        <View>
          <SectionLabel>ARTICLES</SectionLabel>
          <Card>
            {recapLines.map((l) => (
              <Row key={l.label} icon={PackageOpen} title={l.label} subtitle={l.value} />
            ))}
          </Card>
        </View>

        <View>
          <SectionLabel>ADRESSE DE LIVRAISON</SectionLabel>
          <Card>
            <Row icon={MapPin} title={quartier || "—"} subtitle={"Yaoundé, Cameroun"} />
          </Card>
        </View>

        <View>
          <SectionLabel>AUTRES DÉTAILS / INSTRUCTIONS</SectionLabel>
          <Card>
            <Row icon={ClipboardList} title={"—"} subtitle={"Le client souhaite être livré dans l’après midi"} />
          </Card>
        </View>

        <View>
          <SectionLabel>RÉCAPITULATIF</SectionLabel>
          <Card
            footer={
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <AppText style={{ fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                  TOTAL
                </AppText>
                <AppText style={{ fontSize: 18, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                  18 000 FCFA
                </AppText>
              </View>
            }
          >
            {[
              { label: "Coût des articles", value: "15 000 FCFA" },
              { label: "Express", value: "1 000 FCFA" },
              { label: "Frais de livraison", value: "2 000 FCFA" },
              { label: "Autre", value: "0" },
            ].map((l) => (
              <View key={l.label} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.85)" }} numberOfLines={1}>
                  {l.label}
                </AppText>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyMedium, color: colors.text }} numberOfLines={1}>
                  {l.value}
                </AppText>
              </View>
            ))}
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

