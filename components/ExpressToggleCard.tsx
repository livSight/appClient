import { View, Switch } from "react-native";
import { Zap } from "lucide-react-native";
import AppText from "./AppText";
import { colors, fonts, radii } from "../theme/tokens";

type Props = {
  value: boolean;
  onChange: (next: boolean) => void;
  supplementXaf?: number;
};

function formatFcfa(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v.toLocaleString("fr-FR").replace(/\s/g, " ");
}

export default function ExpressToggleCard({ value, onChange, supplementXaf = 1000 }: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#F4EBDD",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            flexShrink: 0,
          }}
        >
          <Zap size={18} color={"#9A5B00"} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2}>
            Livraison Express
          </AppText>
          <AppText
            style={{ marginTop: 4, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.75)" }}
            numberOfLines={2}
          >
            Priorité maximale, livraison en &lt; 45 min
          </AppText>
        </View>

        <View style={{ flexShrink: 0, marginLeft: 10 }}>
          <Switch
            value={value}
            onValueChange={onChange}
            trackColor={{ false: "#D1D5DB", true: "rgba(41,127,198,0.5)" }}
            thumbColor={value ? "#FFFFFF" : "#FFFFFF"}
            ios_backgroundColor="#D1D5DB"
          />
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "#ECEFF1", marginTop: 16, marginBottom: 14 }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.85)" }} numberOfLines={1}>
          Supplément express
        </AppText>
        <View
          style={{
            minHeight: 32,
            borderRadius: radii.pill,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: "rgba(154,91,0,0.08)",
            flexShrink: 0,
          }}
        >
          <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: "#9A5B00" }} numberOfLines={1}>
            +{formatFcfa(supplementXaf)} FCFA
          </AppText>
        </View>
      </View>
    </View>
  );
}

