import { View, Text, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { Search, ChevronRight, ArrowLeft, MapPin, CheckCircle2 } from "lucide-react-native";
import { colors, radii, typography } from "../theme/tokens";
import ScreenLayout from "../components/ScreenLayout";

type Zone = {
  id: string;
  name: string;
  selected?: boolean;
};

const ZONES: Zone[] = [
  { id: "elig-edzoa", name: "Elig-Edzoa" },
  { id: "elig-effa", name: "Elig-Effa" },
  { id: "elig-essono", name: "Elig-Essono" },
  { id: "emombo", name: "Emombo", selected: true },
  { id: "essomba", name: "Essomba" },
];

function ZoneRow({ zone }: { zone: Zone }) {
  return (
    <Pressable
      style={{
        height: zone.selected ? 87.5 : 80,
        borderRadius: radii.card,
        backgroundColor: colors.white,
        borderWidth: zone.selected ? 2 : 0,
        borderColor: zone.selected ? colors.primary : "transparent",
        paddingHorizontal: 20,
        alignItems: "center",
        flexDirection: "row",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.pill,
          backgroundColor: colors.iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {zone.selected ? (
          <CheckCircle2 size={20} color={colors.primary} />
        ) : (
          <MapPin size={20} color={colors.primary} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.sectionTitle, fontSize: 16, lineHeight: 24 }}>
          {zone.name}
        </Text>
        {zone.selected ? (
          <Text style={{ ...typography.cardSubtitle, color: colors.primary, marginTop: 2 }}>
            ZONE SÉLECTIONNÉE
          </Text>
        ) : null}
      </View>

      <ChevronRight size={18} color={colors.tabInactive.commandes} />
    </Pressable>
  );
}

export default function LivraisonZoneScreen() {
  return (
    <ScreenLayout>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", height: 44, marginBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ ...typography.bodyRegular, fontWeight: "600" }}>Livraison</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Text style={{ ...typography.screenTitle, fontSize: 32, lineHeight: 36 }}>
        Choisissez votre zone
      </Text>
      <Text style={{ ...typography.subtitle, marginTop: 10 }}>
        Sélectionnez votre quartier pour découvrir les{"\n"}ateliers disponibles près de chez vous.
      </Text>

      {/* Search input */}
      <View
        style={{
          height: 56,
          borderRadius: radii.card,
          backgroundColor: colors.white,
          marginTop: 18,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <Search size={18} color={colors.tabInactive.rapports} />
        <TextInput
          placeholder="Rechercher un quartier..."
          placeholderTextColor={colors.tabInactive.rapports}
          style={{ flex: 1, marginLeft: 10, fontSize: 14, color: colors.text }}
        />
      </View>

      {/* Zone list */}
      <View style={{ marginTop: 24, gap: 16 }}>
        {ZONES.map((z) => (
          <ZoneRow key={z.id} zone={z} />
        ))}
      </View>

      {/* Bottom CTA */}
      <View style={{ marginTop: 28 }}>
        <Pressable
          style={{
            height: 56,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={typography.buttonTextInverse}>Confirmer la zone</Text>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
