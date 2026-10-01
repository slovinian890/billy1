import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { Currency } from "@/types";

interface RunningTabBarProps {
  totalCents: number;
  currency: Currency;
  onDone: () => void;
  doneLabel?: string;
}

export function RunningTabBar({ totalCents, currency, onDone, doneLabel = "I'm done" }: RunningTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View style={styles.left}>
        <Text style={styles.eyebrow}>YOUR RUNNING TAB</Text>
        <MoneyText cents={totalCents} currency={currency} size={30} color={colors.white} variant="heading" />
      </View>
      <Button title={doneLabel} onPress={onDone} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  left: {
    flexShrink: 1,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.55)",
    marginBottom: spacing.xs,
  },
  button: {
    marginLeft: spacing.md,
  },
});
