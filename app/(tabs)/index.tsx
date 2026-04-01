import { ScrollView, Text, View, Pressable, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CategoryCard({
  title,
  subtitle,
  selected,
  width,
}: {
  title: string;
  subtitle: string;
  selected?: boolean;
  width: number;
}) {
  return (
    <Pressable
      className="bg-white rounded-app"
      style={{
        width,
        borderWidth: selected ? 5 : 0,
        borderColor: selected ? "#3090C0" : "transparent",
        paddingTop: 24,
        paddingLeft: 24,
        paddingRight: 24,
        paddingBottom: 24,
      }}
    >
      <View className="items-center justify-center" style={{ height: 80 }}>
        <View
          className="items-center justify-center rounded-full"
          style={{ width: 56, height: 56, backgroundColor: "#E9F4FB" }}
        >
          <View
            className="rounded-full"
            style={{ width: 24, height: 24, backgroundColor: "#3090C0" }}
          />
        </View>
      </View>

      <View className="items-center" style={{ marginTop: 0 }}>
        <Text
          className="text-app-text"
          style={{ fontSize: 18, lineHeight: 28, fontWeight: "700" }}
        >
          {title}
        </Text>
        <Text
          className="text-app-muted"
          style={{
            fontSize: 12,
            lineHeight: 16,
            fontWeight: "500",
            letterSpacing: 0.6,
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AccueilScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = width - 48;
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;

  return (
    <ScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{
        paddingTop: Math.max(24, insets.top + 24),
        paddingHorizontal: 24,
        paddingBottom: insets.bottom + 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={{ marginBottom: 40 }}>
        <Text
          className="text-app-text"
          style={{
            fontSize: 36,
            lineHeight: 40,
            fontWeight: "800",
            letterSpacing: -0.9,
          }}
        >
          Bonjour Alex
        </Text>
        <Text
          className="text-app-muted"
          style={{ fontSize: 16, lineHeight: 24, fontWeight: "500", marginTop: 8 }}
        >
          Que souhaitez-vous vous faire livrer{"\n"}aujourd'hui ?
        </Text>
      </View>

      {/* Bento Grid */}
      <View style={{ width: contentWidth, marginBottom: 40 }}>
        <View style={{ flexDirection: "row", gap: cardGap }}>
          <CategoryCard title="Nourriture" subtitle="Restaurants" width={cardWidth} />
          <CategoryCard title="Vêtements" subtitle="Mode & Style" width={cardWidth} />
        </View>
        <View style={{ height: 4 }} />
        <View style={{ flexDirection: "row", gap: cardGap }}>
          <CategoryCard title="Ménager" subtitle="Maison" selected width={cardWidth} />
          <CategoryCard title="Colis divers" subtitle="Autres" width={cardWidth} />
        </View>
      </View>

      {/* Promo Banner */}
      <LinearGradient
        colors={["#3090C0", "#1D6E96"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: contentWidth,
          borderRadius: 32,
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 40,
          paddingBottom: 32,
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        {/* Decorative circles (approx) */}
        <View
          style={{
            position: "absolute",
            right: -20,
            bottom: -20,
            width: 160,
            height: 160,
            borderRadius: 9999,
            backgroundColor: "rgba(255,255,255,0.35)",
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 0,
            top: -12,
            width: 96,
            height: 96,
            borderRadius: 9999,
            backgroundColor: "rgba(48,144,192,0.85)",
          }}
        />

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 12,
            lineHeight: 16,
            fontWeight: "700",
            letterSpacing: 1.2,
          }}
        >
          Offre de bienvenue
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            lineHeight: 30,
            fontWeight: "800",
            marginTop: 8,
          }}
        >
          Livraison gratuite sur{"\n"}votre première{"\n"}commande
        </Text>

        <Pressable
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FFFFFF",
            borderRadius: 9999,
            height: 40,
            paddingHorizontal: 24,
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <Text style={{ color: "#3090C0", fontSize: 14, lineHeight: 20, fontWeight: "700" }}>
            En profiter
          </Text>
        </Pressable>
      </LinearGradient>

      {/* Recent Deliveries */}
      <View style={{ width: contentWidth }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text
            className="text-app-text"
            style={{ fontSize: 20, lineHeight: 28, fontWeight: "700", letterSpacing: -0.5 }}
          >
            Dernière commande
          </Text>
          <Pressable>
            <Text style={{ color: "#3090C0", fontSize: 14, lineHeight: 20, fontWeight: "700" }}>
              Voir tout
            </Text>
          </Pressable>
        </View>

        <View
          className="bg-white rounded-app"
          style={{
            borderWidth: 1,
            borderColor: "#BBCBB8",
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#EEF2F7",
              marginRight: 16,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text className="text-app-text" style={{ fontSize: 16, lineHeight: 24, fontWeight: "700" }}>
              Chechia Homme
            </Text>
            <Text className="text-app-muted" style={{ fontSize: 12, lineHeight: 16, fontWeight: "400", marginTop: 4 }}>
              Mobile Omnisports• Il y a 2{"\n"}jours
            </Text>
          </View>
          <View
            style={{
              width: 10,
              height: 10,
              borderRightWidth: 2,
              borderTopWidth: 2,
              borderColor: "#191C1D",
              transform: [{ rotate: "45deg" }],
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

