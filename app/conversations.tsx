import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import AppText from "@/components/AppText";
import AppTextInput from "@/components/AppTextInput";
import TransactionCard from "@/components/TransactionCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { colors, fonts, spacing, typography } from "@/theme/tokens";
import { conversationSearchText, mapConversationToTransactionCardItem } from "@/lib/api/conversationUi";
import { loadConversationList } from "@/lib/api/inbox";
import { type EnrichedConversationItem } from "@/lib/api/ticketUi";
import { shouldRefreshConversations } from "@/lib/push/notificationRouting";
import { usePushRefresh } from "@/lib/push/usePushRefresh";
import { useUnreadCount } from "@/lib/unreadCount";
import { featureFlags } from "@/lib/featureFlags";

export default function ConversationsScreen() {
  const { setTotalUnread } = useUnreadCount();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (featureFlags.messagingEnabled) return;
    router.replace("/(tabs)");
  }, []);

  const [conversations, setConversations] = useState<EnrichedConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      const { items, totalUnread } = await loadConversationList();
      setConversations(items);
      setTotalUnread(totalUnread);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e ?? "Erreur"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setTotalUnread]);

  useFocusEffect(
    useCallback(() => {
      void loadConversations("initial");
    }, [loadConversations]),
  );

  usePushRefresh(
    useCallback((payload) => shouldRefreshConversations(payload), []),
    useCallback(() => {
      void loadConversations("refresh");
    }, [loadConversations]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => conversationSearchText(c).includes(q));
  }, [conversations, query]);

  return (
    <ScreenLayout
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadConversations("refresh");
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ),
      }}
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
      <View style={{ gap: 24, marginTop: 6, paddingBottom: 8 }}>
        {loading ? (
          <View style={{ paddingVertical: 8 }}>
            <AppText style={{ ...typography.subtitle, fontFamily: fonts.bodySemi }} numberOfLines={2}>
              Chargement…
            </AppText>
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 8 }}>
            <AppText style={{ ...typography.subtitle, fontFamily: fonts.bodySemi }} numberOfLines={3}>
              {error}
            </AppText>
            <Pressable
              onPress={() => {
                void loadConversations("initial");
              }}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
              hitSlop={10}
            >
              <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyStateCard
            label={query.trim().length > 0 ? "RECHERCHE" : "BIENVENUE"}
            iconName="solar:chat-round-dots-bold"
            title={query.trim().length > 0 ? "Aucun résultat" : "Aucune conversation pour l’instant"}
            subtitle={
              query.trim().length > 0
                ? "Essayez avec une autre référence ou un autre mot-clé."
                : "Les conversations apparaissent ici une fois qu'un échange a été ouvert sur une commande."
            }
            ctas={
              query.trim().length > 0
                ? []
                : [{ label: "Voir mes livraisons", onPress: () => router.push("/(tabs)/livraison") }]
            }
          />
        ) : (
          filtered.map((c) => (
            <TransactionCard
              key={c.id}
              item={mapConversationToTransactionCardItem(c)}
              onPress={() => router.push({ pathname: "/inbox/[id]", params: { id: c.id } })}
            />
          ))
        )}
      </View>
    </ScreenLayout>
  );
}
