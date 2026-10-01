import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface ParticipantPickRowProps {
  name: string;
  color: string;
  selected: boolean;
  onPress: () => void;
  /** "check" for multi-select (split), "radio" for single-select (reassign). */
  mode?: "check" | "radio";
  subtitle?: string;
}

export function ParticipantPickRow({
  name,
  color,
  selected,
  onPress,
  mode = "check",
  subtitle,
}: ParticipantPickRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={mode === "check" ? "checkbox" : "radio"}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Avatar name={name} color={color} size={40} />
      <View style={styles.textWrap}>
        <Text style={styles.name}>{name}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View
        style={[
          mode === "check" ? styles.checkbox : styles.radio,
          selected && (mode === "check" ? styles.checkboxOn : styles.radioOn),
        ]}
      >
        {selected && mode === "check" && <Text style={styles.tick}>✓</Text>}
        {selected && mode === "radio" && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.65,
  },
  textWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radii.sm - 4,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tick: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: colors.accent,
  },
});
