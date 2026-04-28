import { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import AppText from "@/components/AppText";
import AppTextInput from "@/components/AppTextInput";
import ConversationCard, { type ConversationItem } from "@/components/ConversationCard";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { colors, fonts, spacing, typography } from "@/theme/tokens";
import { listTransactionsForDevUser, type Transaction } from "@/lib/api/deliveries";

export default function ConversationsScreen() {
  const [query, setQuery] = useState("");

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listTransactionsForDevUser();
        if (!mounted) return;
        setTxns(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message ?? e ?? "Erreur"));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function timeLabelFromIso(iso?: string) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch {
      return "—";
    }
  }

  function mapTxnToConversation(tx: Transaction): ConversationItem | null {
    const id = String(tx.id ?? "");
    if (!id) return null;

    const ref = typeof tx.transactionReference === "string" && tx.transactionReference.trim().length ? tx.transactionReference.trim() : `TR-${id}`;
    const amountXaf = Number.isFinite(Number(tx.amount)) ? Math.max(0, Math.round(Number(tx.amount))) : null;
    const subtitle = typeof tx.description === "string" && tx.description.trim().length ? tx.description.trim() : "Aucune description donnée";
    const timeLabel = timeLabelFromIso(tx.created_at);

    const typeRaw = String(tx.type ?? "").toLowerCase();
    if (typeRaw === "expedition") {
      const from = tx.departure?.city?.trim() || "—";
      const to = tx.destination?.city?.trim() || "—";
      return {
        id,
        refLabel: `REF: ${ref}`,
        timeLabel,
        type: "expedition",
        trajet: `${from} → ${to}`,
        agence: tx.departure?.region?.trim() || "—",
        amountXaf,
        subtitle,
      };
    }

    const modeRaw = String(tx.mode ?? typeRaw).toLowerCase();
    const deliveryMode = modeRaw === "pickup" ? "RAMASSAGE" : "EN STOCK";
    const street = tx.destination?.street?.trim() || "";
    const quartier = street.split("—")[0]?.trim() || street || "—";

    return {
      id,
      refLabel: `REF: ${ref}`,
      timeLabel,
      type: "livraison",
      deliveryMode,
      quartier,
      amountXaf,
      subtitle,
    };
  }

  const all = useMemo<ConversationItem[]>(() => txns.map(mapTxnToConversation).filter(Boolean) as ConversationItem[], [txns]);

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
                setLoading(true);
                setError(null);
                void (async () => {
                  try {
                    const data = await listTransactionsForDevUser();
                    setTxns(data);
                  } catch (e: any) {
                    setError(String(e?.message ?? e ?? "Erreur"));
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
              hitSlop={10}
            >
              <AppText style={{ ...typography.bodyRegular, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                Réessayer
              </AppText>
            </Pressable>
          </View>
        ) : (
          filtered.map((c) => (
            <ConversationCard
              key={c.id}
              item={c}
              onPress={() => router.push({ pathname: "/inbox/[id]", params: { id: c.id } })}
            />
          ))
        )}
      </View>
    </ScreenLayout>
  );
}
