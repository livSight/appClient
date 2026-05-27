import { Pressable, View } from "react-native";
import * as Linking from "expo-linking";
import { FontAwesome } from "@expo/vector-icons";
import AppText from "@/components/AppText";
import SolarIcon from "@/components/SolarIcon";
import { card } from "@/theme/styles";
import { colors, fonts, typography } from "@/theme/tokens";

function toE164Cameroon(phoneRaw: string): string | null {
  const digits = phoneRaw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits;
  const onlyDigits = digits.replace(/[^\d]/g, "");
  if (onlyDigits.length === 9 && (onlyDigits.startsWith("6") || onlyDigits.startsWith("7"))) return `+237${onlyDigits}`;
  if (onlyDigits.length >= 10) return `+${onlyDigits}`;
  return null;
}

export default function RecipientCard({
  title = "Client",
  phone,
  subtitle = "Contact client",
}: {
  title?: string;
  phone: string;
  subtitle?: string;
}) {
  return (
    <View style={[card.base, { padding: 24 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <SolarIcon name="solar:user-outline" size={24} color={colors.primary} />
        <AppText variant="dense" style={{ marginLeft: 10, fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
          {title}
        </AppText>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
            {phone}
          </AppText>
          <AppText variant="dense" style={{ ...typography.subtitle, fontSize: 12, lineHeight: 16, marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", gap: 10, flexShrink: 0 }}>
          <Pressable
            onPress={() => {
              const e164 = toE164Cameroon(phone);
              void Linking.openURL(`tel:${e164 ?? phone}`);
            }}
            hitSlop={10}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <SolarIcon name="solar:phone-outline" size={22} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              const e164 = toE164Cameroon(phone);
              const phoneDigits = (e164 ?? phone).replace(/[^\d]/g, "");
              void Linking.openURL(`https://wa.me/${phoneDigits}`);
            }}
            hitSlop={10}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <FontAwesome name="whatsapp" size={24} color={"#25D366"} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

