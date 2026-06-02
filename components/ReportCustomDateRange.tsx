import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import AppText from "@/components/AppText";
import SolarIcon from "@/components/SolarIcon";
import { colors, fonts, radii } from "@/theme/tokens";

type PickerField = "start" | "end" | null;

type Props = {
  startDate: Date;
  endDate: Date;
  onChangeStart: (date: Date) => void;
  onChangeEnd: (date: Date) => void;
  maximumDate?: Date;
};

function formatDateButton(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function DateField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: radii.card,
        backgroundColor: colors.white,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="dense" style={{ fontSize: 10, lineHeight: 14, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.55)" }} numberOfLines={1}>
          {label}
        </AppText>
        <AppText style={{ marginTop: 2, fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </AppText>
      </View>
      <SolarIcon name="solar:calendar-outline" size={20} color={colors.primary} />
    </Pressable>
  );
}

export default function ReportCustomDateRange({ startDate, endDate, onChangeStart, onChangeEnd, maximumDate }: Props) {
  const [openField, setOpenField] = useState<PickerField>(null);

  const handlePickerChange = (field: Exclude<PickerField, null>) => (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setOpenField(null);
    if (event.type === "dismissed" || !date) return;
    if (field === "start") onChangeStart(date);
    else onChangeEnd(date);
  };

  const pickerValue = openField === "end" ? endDate : startDate;
  const pickerMinimum = openField === "end" ? startDate : undefined;
  const pickerMaximum = openField === "start" ? endDate : maximumDate;

  return (
    <View style={{ marginTop: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <DateField label="Du" value={formatDateButton(startDate)} onPress={() => setOpenField("start")} />
        <DateField label="Au" value={formatDateButton(endDate)} onPress={() => setOpenField("end")} />
      </View>

      {openField && (
        <View style={{ borderRadius: radii.card, backgroundColor: colors.white, overflow: "hidden" }}>
          <DateTimePicker
            value={pickerValue}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            locale="fr-FR"
            minimumDate={pickerMinimum}
            maximumDate={pickerMaximum}
            onChange={handlePickerChange(openField)}
          />
          {Platform.OS === "ios" ? (
            <Pressable
              onPress={() => setOpenField(null)}
              style={{ paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(192,199,210,0.2)" }}
            >
              <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.primary }} numberOfLines={1}>
                OK
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}
