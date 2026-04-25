import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "../../components/ScreenLayout";
import LivraisonCard, { type LivraisonOrder } from "../../components/LivraisonCard";
import { colors, fonts, radii, spacing, typography } from "../../theme/tokens";
import AppText from "../../components/AppText";

type Status = "Tout" | "En cours" | "Livré" | "Annulé";

const MOCK_ORDERS: LivraisonOrder[] = [
  {
    id: "101",
    ref: "#AD-3012",
    title: "Panier de légumes bio",
    quartier: "Bastos",
    dateLabel: "Aujourd'hui, 12:45",
    status: "En cours",
    amountLabel: "4 000 FCFA",
    paymentLabel: "ESPÈCES",
  },
  {
    id: "102",
    ref: "#AD-3008",
    title: "Chaussures x2",
    quartier: "Emombo",
    dateLabel: "01 avr. 2026, 10:10",
    status: "Livré",
    amountLabel: "15 000 FCFA",
    paymentLabel: "MOBILE MONEY",
  },
  {
    id: "103",
    ref: "#AD-2991",
    title: "Colis divers",
    quartier: "Mvan",
    dateLabel: "28 mars 2026, 18:20",
    status: "Annulé",
    amountLabel: "2 500 FCFA",
    paymentLabel: "ESPÈCES",
  },
];

function Chip({ label, active }: { label: Status; active?: boolean }) {
  return (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: radii.pill,
        backgroundColor: active ? colors.primary : "#E9E9EA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        variant="dense"
        style={{
          ...(typography.bodyRegular as object),
          fontFamily: fonts.bodySemi,
          color: active ? colors.white : colors.text,
        }}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );
}

export default function LivraisonScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [active, setActive] = useState<Status>(() => {
    if (filter === "En cours") return "En cours";
    if (filter === "Livré") return "Livré";
    if (filter === "Annulé") return "Annulé";
    return "Tout";
  });
  const orders = useMemo(() => {
    if (active === "Tout") return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => o.status === active);
  }, [active]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={2}>
            Mes Livraisons
          </AppText>
          <AppText style={[typography.subtitle, { marginTop: 4 }]}>
            Consultez toutes vos livraisons
          </AppText>
        </View>
      }
    >
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
          onPress={() => router.push("/ma-demande-livraison")}
          style={{
            minHeight: 56,
            paddingVertical: 14,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
            Demander une nouvelle livraison
          </AppText>
        </Pressable>
      </View>

      {orders.length === 0 ? (
        <View style={{ marginTop: 6, borderRadius: radii.card, backgroundColor: colors.white, padding: 20 }}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            {active === "En cours"
              ? "Aucune livraison en cours"
              : active === "Livré"
                ? "Aucune livraison livrée pour le moment"
                : active === "Annulé"
                  ? "Aucune livraison annulée"
                  : "Vous n'avez pas encore de livraison"}
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }}>
            {active === "Tout" ? "Créez votre première livraison en 30 secondes." : ""}
          </AppText>
          {active === "En cours" || active === "Tout" ? (
            <Pressable
              onPress={() => router.push("/ma-demande-livraison")}
              style={{
                marginTop: 14,
                minHeight: 56,
                paddingVertical: 14,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={typography.buttonTextInverse} numberOfLines={2} ellipsizeMode="tail">
                {active === "Tout" ? "Créer votre première livraison" : "Demander une livraison"}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 24, paddingBottom: 8 }}>
          {orders.map((o) => (
            <LivraisonCard key={o.id} order={o} />
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}
