import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import AppText from "@/components/AppText";
import AppTextInput from "@/components/AppTextInput";
import ConversationCard, { type ConversationItem } from "@/components/ConversationCard";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { colors, fonts, spacing, typography } from "@/theme/tokens";

export default function ConversationsScreen() {
  const [query, setQuery] = useState("");

  const all = useMemo<ConversationItem[]>(
    () => [
      {
        id: "1",
        refLabel: "REF: #AD-3012 | JOEL DECOR",
        timeLabel: "15:30",
        type: "livraison",
        deliveryMode: "RAMASSAGE",
        quartier: "Bastos",
        amountXaf: 2500,
        subtitle: "Merci beaucoup",
        unreadCount: 1,
      },
      {
        id: "2",
        refLabel: "REF: #AD-3008 | SANTA LUCIA",
        timeLabel: "14:30",
        type: "livraison",
        deliveryMode: "EN STOCK",
        quartier: "Emombo",
        amountXaf: null,
        subtitle: "Je suis en colère",
        unreadCount: 1,
      },
      {
        id: "3",
        refLabel: "REF: #EX-1041 | ORCA DEO",
        timeLabel: "11:30",
        type: "expedition",
        trajet: "Yaoundé → Douala",
        agence: "Buca Voyage",
        amountXaf: 5000,
        subtitle: "Acceptez 1500",
        unreadCount: 2,
      },
      {
        id: "4",
        refLabel: "REF: #AD-2991 | GEEK GAMING",
        timeLabel: "Hier",
        type: "livraison",
        deliveryMode: "EN STOCK",
        quartier: "Mvan",
        amountXaf: 15000,
        subtitle: "Merci pour la rapidité !",
      },
      {
        id: "5",
        refLabel: "REF: #EX-1038 | MARIE NGUEMA",
        timeLabel: "Hier",
        type: "expedition",
        trajet: "Yaoundé → Bafoussam",
        agence: "Général Voyage",
        amountXaf: null,
        subtitle: "Livré au gardien comme convenu.",
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => `${c.refLabel} ${c.title} ${c.subtitle}`.toLowerCase().includes(q));
  }, [all, query]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 14 }}>
          <AppText style={[typography.screenTitle, { fontSize: 26, lineHeight: 30 }]} numberOfLines={1}>
            Conversations
          </AppText>

          <View style={{ marginTop: 16 }}>
            <View
              style={{
                minHeight: 44,
                borderRadius: 14,
                backgroundColor: "#F3F4F5",
                paddingLeft: 14,
                paddingRight: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <SolarIcon name="solar:magnifer-outline" size={18} color={"rgba(107,114,128,1)"} />
              <AppTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une commande..."
                placeholderTextColor="#6B7280"
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontFamily: fonts.bodyRegular,
                  color: colors.text,
                  paddingVertical: 8,
                }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                variant="dense"
              />
            </View>
          </View>
        </View>
      }
    >
      <View style={{ gap: spacing.screenPaddingX / 2, marginTop: 6 }}>
        {filtered.map((c) => (
          <ConversationCard
            key={c.id}
            item={c}
            onPress={() => router.push(`/inbox/${c.id}`)}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}
