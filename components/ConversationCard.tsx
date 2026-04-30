import { Pressable, View } from "react-native";
import AppText from "./AppText";
import { card } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";

type ConversationLivraison = {
  type: "livraison";
  quartier: string;
  amountXaf?: number | null;
};

type ConversationExpedition = {
  type: "expedition";
  trajet: string; // "Yaoundé → Douala"
  agence: string; // "Buca Voyage"
  amountXaf?: number | null;
};

export type ConversationItem = {
  id: string;
  refLabel: string;
  timeLabel: string;
  subtitle: string; // last message
  unreadCount?: number;
} & (ConversationLivraison | ConversationExpedition);

function TypeBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        minHeight: 20,
        borderRadius: radii.pill,
        backgroundColor: "rgba(14,165,233,0.10)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
        flexShrink: 0,
      }}
    >
      <AppText variant="dense" style={{ fontSize: 10, lineHeight: 14, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.8 }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export default function ConversationCard({
  item,
  onPress,
}: {
  item: ConversationItem;
  onPress?: () => void;
}) {
  const hasAmount = typeof item.amountXaf === "number" && item.amountXaf > 0;
  const amountLabel = hasAmount
    ? `${item.amountXaf!.toLocaleString("fr-FR").replace(/\s/g, " ")} FCFA`
    : null;

  return (
    <Pressable onPress={onPress} style={[card.base, { padding: 16 }]}>
      {/* Top row: ref + time */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <AppText
          variant="dense"
          style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 1, textTransform: "uppercase", flex: 1 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.refLabel}
        </AppText>
        <AppText variant="dense" style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyMedium, color: "#94A3B8", flexShrink: 0 }} numberOfLines={1}>
          {item.timeLabel}
        </AppText>
      </View>

      {/* Type badge + location */}
      <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
        {item.type === "livraison" ? (
          <>
            <TypeBadge label="LIVRAISON" />
            <AppText
              style={{ fontSize: 15, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text, flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.quartier}
            </AppText>
          </>
        ) : (
          <>
            <TypeBadge label="EXPÉDITION" />
            <AppText
              style={{ fontSize: 15, lineHeight: 22, fontFamily: fonts.bodyBold, color: colors.text, flex: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.trajet}
            </AppText>
          </>
        )}
      </View>

      {/* Extra info: agence for expedition */}
      {item.type === "expedition" ? (
        <AppText
          variant="dense"
          style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.agence}
        </AppText>
      ) : null}

      {/* Bottom row: last message + amount + unread badge */}
      <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <AppText
          variant="dense"
          style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, flex: 1 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.subtitle}
        </AppText>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {amountLabel ? (
            <AppText
              variant="dense"
              style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.text }}
              numberOfLines={1}
            >
              {amountLabel}
            </AppText>
          ) : null}

          {item.unreadCount ? (
            <View
              style={{
                minHeight: 20,
                minWidth: 20,
                borderRadius: radii.pill,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <AppText variant="dense" style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
                {String(item.unreadCount)}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
