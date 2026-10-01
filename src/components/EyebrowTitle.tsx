import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, fonts, spacing } from "@/theme/tokens";

interface EyebrowTitleProps {
  eyebrow: string;
  title: string;
  /** Text colour for the title — defaults to the primary text colour. */
  titleColor?: string;
  eyebrowColor?: string;
  titleSize?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The small uppercase label + big Playfair Display title pattern used at
 * the top of nearly every screen ("ACTIVE BILL · 20 AUG" / "Friday Dinner").
 */
export function EyebrowTitle({
  eyebrow,
  title,
  titleColor = colors.textPrimary,
  eyebrowColor = colors.textMuted,
  titleSize = 32,
  style,
}: EyebrowTitleProps) {
  return (
    <View style={style}>
      <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: titleColor, fontSize: titleSize }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
  },
});
