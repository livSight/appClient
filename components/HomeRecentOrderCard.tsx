import { Pressable, View } from "react-native";
import { MessageCircleMore } from "lucide-react-native";
import { card, icon } from "../theme/styles";
import { colors, fonts, radii, typography } from "../theme/tokens";
import AppText from "./AppText";

function formatXaf(n) {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function StatusPill({ status }) {
  let bg = "rgba(48,144,192,0.16)";
  let fg = colors.primary;
  if (status === "Livré") {
    bg = "rgba(46,125,50,0.14)";
    fg = "#2E7D32";
  } else if (status === "Annulé") {
    bg = "rgba(211,47,47,0.14)";
    fg = "#D32F2F";
  }

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <AppText
        variant="dense"
        style={{
          fontSize: 11,
          lineHeight: 14,
          fontFamily: fonts.bodyBold,
          color: fg,
          letterSpacing: 0.6,
        }}
        numberOfLines={1}
      >
        {status.toUpperCase()}
      </AppText>
    </View>
  );
}

export default function HomeRecentOrderCard({
  title,
  meta,
  status,
  totalXaf,
  collectCashXaf,
  onPress,
  onQuickActionPress = () => {},
}) {
  const moneyLine =
    typeof totalXaf === "number" && Number.isFinite(totalXaf) && totalXaf > 0
      ? `Total: ${formatXaf(totalXaf)} FCFA`
      : "";
  const collectLine =
    typeof collectCashXaf === "number" && Number.isFinite(collectCashXaf) && collectCashXaf > 0
      ? `À encaisser: ${formatXaf(collectCashXaf)} FCFA`
      : "";
  const metaLines = [meta, moneyLine, collectLine].filter(Boolean).join("\n");

  return (
    <Pressable onPress={onPress} style={[card.outlined, { position: "relative", padding: 20, overflow: "visible" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[icon.placeholder, { backgroundColor: "#F3F4F5", borderRadius: 24, marginRight: 16 }]} />

        <View style={{ flex: 1, minWidth: 0, paddingRight: 56 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24, fontFamily: fonts.bodyBold }} numberOfLines={1} ellipsizeMode="tail">
                {title}
              </AppText>
            </View>
            {status ? <StatusPill status={status} /> : null}
          </View>

          <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, color: "rgba(60,74,60,0.6)", marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
            {metaLines}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={onQuickActionPress}
        hitSlop={10}
        style={{
          position: "absolute",
          right: 18,
          bottom: -18,
          width: 64,
          height: 64,
          borderRadius: radii.pill,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <MessageCircleMore size={22} color={colors.white} />
      </Pressable>
    </Pressable>
  );
}

