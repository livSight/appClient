import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AppText from "@/components/AppText";
import SolarIcon from "@/components/SolarIcon";
import {
  isoDateFromDateInSchedulingTimezone,
  minimumSelectableDeliveryDate,
  parseIsoDateOnly,
  formatScheduledDeliveryDisplayLabel,
} from "@/lib/scheduling/deliveryDate";
import { colors, fonts, radii } from "@/theme/tokens";

const INPUT_BG = "#F3F4F5";
const INPUT_RADIUS = 24;

type Props = {
  value: string;
  onChange: (iso: string) => void;
  testID?: string;
};

export default function DeliveryDateField({ value, onChange, testID }: Props) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseIsoDateOnly(value) ?? minimumSelectableDeliveryDate();
  const minimumDate = minimumSelectableDeliveryDate();

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !date) return;
    onChange(isoDateFromDateInSchedulingTimezone(date));
  }

  return (
    <View testID={testID} style={{ gap: 10 }}>
      <AppText
        style={{
          fontSize: 14,
          lineHeight: 20,
          fontFamily: fonts.bodySemi,
          color: colors.text,
        }}
        numberOfLines={2}
      >
        Date de livraison
      </AppText>

      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        style={{
          minHeight: 56,
          borderRadius: INPUT_RADIUS,
          backgroundColor: INPUT_BG,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <SolarIcon name="solar:calendar-outline" size={20} color={colors.primary} />
        <AppText
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            lineHeight: 22,
            fontFamily: fonts.bodyRegular,
            color: colors.text,
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {formatScheduledDeliveryDisplayLabel(value)}
        </AppText>
      </Pressable>

      {open ? (
        <View
          style={{
            borderRadius: radii.card,
            backgroundColor: colors.white,
            overflow: "hidden",
            alignSelf: "stretch",
          }}
        >
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            locale="fr-FR"
            minimumDate={minimumDate}
            onChange={handleChange}
            style={Platform.OS === "ios" ? { alignSelf: "center", width: "100%" } : undefined}
          />
          {Platform.OS === "ios" ? (
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                paddingVertical: 12,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: "rgba(192,199,210,0.2)",
              }}
            >
              <AppText
                style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.primary }}
                numberOfLines={1}
              >
                OK
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
