import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import AppText from "./AppText";
import SolarIcon from "./SolarIcon";
import { colors, fonts, radii } from "../theme/tokens";

/**
 * Pill-shaped filter field that opens a bottom-sheet option picker.
 * Tints itself when the value differs from `defaultValue` so an active
 * filter is visible at a glance. Used on Mes Courses and Conversations.
 */
export default function FilterDropdown<T extends string>({
  title,
  iconName,
  value,
  options,
  defaultValue,
  onSelect,
}: {
  title: string;
  iconName: string;
  value: T;
  options: readonly T[];
  defaultValue: T;
  onSelect: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = value !== defaultValue;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: radii.pill,
          backgroundColor: isActive ? "rgba(48,144,192,0.10)" : colors.white,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          gap: 8,
        }}
      >
        <SolarIcon name={iconName} size={18} color={isActive ? colors.primary : "rgba(60,74,60,0.55)"} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText
            variant="dense"
            style={{
              fontSize: 13,
              lineHeight: 18,
              fontFamily: fonts.bodySemi,
              color: isActive ? colors.primary : colors.text,
            }}
            numberOfLines={1}
          >
            {value}
          </AppText>
        </View>
        <SolarIcon
          name="solar:alt-arrow-right-outline"
          size={16}
          color={isActive ? colors.primary : "rgba(60,74,60,0.45)"}
          style={{ transform: [{ rotate: "90deg" }] }}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.35)", justifyContent: "flex-end" }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 36,
            }}
          >
            <AppText
              variant="dense"
              style={{
                fontSize: 12,
                lineHeight: 16,
                fontFamily: fonts.bodyBold,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "rgba(60,74,60,0.55)",
                marginBottom: 6,
              }}
              numberOfLines={1}
            >
              {title}
            </AppText>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                style={{
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <AppText
                  style={{
                    fontSize: 15,
                    lineHeight: 22,
                    fontFamily: option === value ? fonts.bodyBold : fonts.bodyRegular,
                    color: option === value ? colors.primary : colors.text,
                  }}
                  numberOfLines={1}
                >
                  {option}
                </AppText>
                {option === value ? <SolarIcon name="solar:check-circle-bold" size={20} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
