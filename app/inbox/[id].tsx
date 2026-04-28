import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AppText from "@/components/AppText";
import AppTextInput from "@/components/AppTextInput";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { colors, fonts, radii, spacing, typography } from "@/theme/tokens";
import { getTransactionById, type Transaction } from "@/lib/api/deliveries";

type TxInfo = {
  ref: string;
  status: string;
  statusColor: string;
  statusBg: string;
  type: string;
  location: string;
  amountLabel?: string;
};

function mapBackendStatusToBanner(status?: string | null) {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "delivered") return { status: "LIVRÉ", statusColor: "#2E7D32", statusBg: "#EAF7EE" };
  if (s === "failed" || s === "cancelled") return { status: "ANNULÉ", statusColor: "#D32F2F", statusBg: "#FCECEC" };
  return { status: "EN COURS", statusColor: colors.primary, statusBg: "#E9F4FB" };
}

function formatAmountLabel(amount?: number | null) {
  const n = Number.isFinite(Number(amount)) ? Math.max(0, Math.round(Number(amount))) : 0;
  return n > 0 ? `${n.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA` : undefined;
}

function mapTransactionToTxInfo(tx: Transaction): TxInfo {
  const ref = typeof tx.transactionReference === "string" && tx.transactionReference.trim().length ? tx.transactionReference.trim() : `TR-${String(tx.id ?? "")}`;
  const { status, statusColor, statusBg } = mapBackendStatusToBanner(typeof tx.status === "string" ? tx.status : null);
  const typeRaw = String(tx.type ?? tx.mode ?? "").toLowerCase();
  const typeLabel = typeRaw === "pickup" ? "RAMASSAGE" : typeRaw === "expedition" ? "EXPÉDITION" : "EN STOCK";

  const location =
    typeRaw === "expedition"
      ? `${tx.departure?.city?.trim() || "—"} → ${tx.destination?.city?.trim() || "—"}`
      : tx.destination?.street?.trim() || "—";

  return {
    ref,
    status,
    statusColor,
    statusBg,
    type: typeLabel,
    location,
    amountLabel: formatAmountLabel((tx as any).amount),
  };
}

function TransactionBanner({ tx, onPress }: { tx: TxInfo; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: -spacing.screenPaddingX,
        paddingHorizontal: spacing.screenPaddingX,
        paddingVertical: 12,
        backgroundColor: "rgba(14,165,233,0.06)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(14,165,233,0.14)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <AppText
            variant="dense"
            style={{ fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.8 }}
            numberOfLines={1}
          >
            REF {tx.ref}
          </AppText>
          <AppText
            variant="dense"
            style={{ fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.5)" }}
            numberOfLines={1}
          >
            {tx.type}
          </AppText>
          <AppText
            variant="dense"
            style={{ fontSize: 11, lineHeight: 16, fontFamily: fonts.bodySemi, color: colors.text }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {tx.location}
          </AppText>
        </View>
        {tx.amountLabel ? (
          <AppText
            variant="dense"
            style={{ fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.text, marginTop: 2 }}
            numberOfLines={1}
          >
            À collecter : {tx.amountLabel}
          </AppText>
        ) : null}
      </View>

      <View
        style={{
          minHeight: 24,
          borderRadius: radii.pill,
          backgroundColor: tx.statusBg,
          paddingHorizontal: 10,
          paddingVertical: 4,
          flexShrink: 0,
        }}
      >
        <AppText
          variant="dense"
          style={{ fontSize: 10, lineHeight: 16, fontFamily: fonts.bodyBold, color: tx.statusColor, letterSpacing: 0.6 }}
          numberOfLines={1}
        >
          {tx.status}
        </AppText>
      </View>

      <SolarIcon name="solar:alt-arrow-right-outline" size={16} color={"rgba(14,165,233,0.50)"} />
    </Pressable>
  );
}

type Message = {
  id: string;
  side: "left" | "right";
  text: string;
  meta: string;
  time?: string;
};

function Bubble({ msg }: { msg: Message }) {
  const isLeft = msg.side === "left";
  const bubbleBg = isLeft ? "#F3F4F5" : colors.primary;
  const textColor = isLeft ? colors.text : colors.white;
  const metaColor = isLeft ? "rgba(60,74,60,0.60)" : "rgba(14,165,233,0.70)";

  return (
    <View style={{ width: "100%", alignItems: isLeft ? "flex-start" : "flex-end" }}>
      <View style={{ maxWidth: 332 }}>
        <View
          style={{
            backgroundColor: bubbleBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottomLeftRadius: isLeft ? 24 : 24,
            borderBottomRightRadius: isLeft ? 24 : 24,
            ...(isLeft ? { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 } : { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }),
            paddingLeft: 20,
            paddingRight: isLeft ? 23 : 55,
            paddingTop: 15,
            paddingBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isLeft ? 0.05 : 0.12,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <AppText style={{ fontSize: 15, lineHeight: 24.5, fontFamily: fonts.bodyRegular, color: textColor }} numberOfLines={10}>
            {msg.text}
          </AppText>
        </View>

        {isLeft ? (
          <View style={{ marginTop: 6, paddingLeft: 4 }}>
            <AppText variant="dense" style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodySemi, color: metaColor }} numberOfLines={1} ellipsizeMode="tail">
              {msg.meta}
            </AppText>
          </View>
        ) : (
          <View style={{ marginTop: 6, paddingRight: 4, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
            <AppText variant="dense" style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodySemi, color: metaColor }} numberOfLines={1}>
              {msg.time ?? ""}
            </AppText>
            <SolarIcon name="solar:check-circle-bold" size={12} color={"rgba(14,165,233,0.70)"} />
          </View>
        )}
      </View>
    </View>
  );
}

export default function InboxChatScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [draft, setDraft] = useState("");
  const [tx, setTx] = useState<TxInfo | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setTx(null);
      return;
    }
    (async () => {
      try {
        const data = await getTransactionById(String(id));
        if (!mounted) return;
        setTx(mapTransactionToTxInfo(data));
      } catch {
        if (!mounted) return;
        setTx(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const messages = useMemo<Message[]>(
    () => [
      {
        id: "m1",
        side: "left",
        text: "Bonjour Alex, notre coursier est en route. Avez-vous des précisions pour la remise du colis ?",
        meta: "Ongola Express • 10:45",
      },
      {
        id: "m2",
        side: "right",
        text: "Bonjour ! Oui, le client est devant l'immeuble. Il est habillé en habit rouge.",
        meta: "",
        time: "10:47",
      },
    ],
    [],
  );

  const footerNode = (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: "rgba(255,255,255,0.92)",
      }}
    >
      <View style={{ minHeight: 56, borderRadius: 24, backgroundColor: "#F3F4F5", paddingLeft: 16, paddingRight: 8, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={() => {}}
          hitSlop={10}
          style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}
        >
          <SolarIcon name="solar:add-square-outline" size={20} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppTextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Écrire un message..."
            placeholderTextColor={"rgba(60,74,60,0.50)"}
            style={{
              fontSize: 15,
              fontFamily: fonts.bodyMedium,
              color: colors.text,
              paddingVertical: 8,
            }}
          />
        </View>

        <Pressable
          onPress={() => {}}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SolarIcon name="solar:alt-arrow-right-outline" size={20} color={colors.white} />
        </Pressable>
      </View>

      <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 10, lineHeight: 14, marginTop: 8, opacity: 0.6 }} numberOfLines={1}>
        Ref: {id ?? "—"}
      </AppText>
    </View>
  );

  return (
    <ScreenLayout
      header={
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36, height: 44, justifyContent: "center" }}>
              <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.primary} />
            </Pressable>

            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Avatar with online dot */}
              <View style={{ width: 42, height: 42, flexShrink: 0 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9999,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText
                    variant="dense"
                    style={{ fontSize: 14, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.white, letterSpacing: 0.5 }}
                  >
                    AL
                  </AppText>
                </View>
                <View
                  style={{
                    position: "absolute",
                    right: 1,
                    bottom: 1,
                    width: 11,
                    height: 11,
                    borderRadius: 9999,
                    backgroundColor: "#22C55E",
                    borderWidth: 2,
                    borderColor: colors.white,
                  }}
                />
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                  Agent Livsight
                </AppText>
                <AppText variant="dense" style={{ fontSize: 11, lineHeight: 15, fontFamily: fonts.bodySemi, color: "#22C55E" }} numberOfLines={1}>
                  En ligne
                </AppText>
              </View>
            </View>

            {/* Action buttons: video + phone */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Pressable
                onPress={() => {}}
                hitSlop={10}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <SolarIcon name="solar:videocamera-outline" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => {}}
                hitSlop={10}
                style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <SolarIcon name="solar:phone-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {tx ? (
            <TransactionBanner
              tx={tx}
              onPress={() => {
                if (tx.type === "EXPÉDITION") {
                  router.push(`/ma-demande-expedition`);
                } else {
                  router.push(`/livraison-detail/${id}`);
                }
              }}
            />
          ) : null}
        </View>
      }
      footer={footerNode}
    >
      <View style={{ paddingTop: 18, paddingBottom: 24, gap: 24 }}>
        <View style={{ alignItems: "center" }}>
          <View style={{ minHeight: 24, borderRadius: radii.pill, backgroundColor: "#F3F4F5", paddingHorizontal: 16, paddingVertical: 4 }}>
            <AppText variant="dense" style={{ fontSize: 11, lineHeight: 16.5, fontFamily: fonts.bodyBold, color: "#3C4A3C", letterSpacing: 1.1, textTransform: "uppercase" }} numberOfLines={1}>
              Aujourd&apos;hui
            </AppText>
          </View>
        </View>

        {messages.map((m) => (
          <Bubble key={m.id} msg={m} />
        ))}
      </View>
    </ScreenLayout>
  );
}

