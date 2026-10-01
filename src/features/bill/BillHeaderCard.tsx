import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { MoneyText } from "@/components/MoneyText";
import { ProgressBar } from "@/components/ProgressBar";
import { colors, fonts, gradients, radii, shadows, spacing } from "@/theme/tokens";
import type { Currency } from "@/types";

interface BillHeaderCardProps {
  venue: string;
  totalCents: number;
  currency: Currency;
  claimed: number;
  total: number;
}

export function BillHeaderCard({ venue, totalCents, currency, claimed, total }: BillHeaderCardProps) {
  const progress = total === 0 ? 0 : claimed / total;

  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, shadows.card]}
    >
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{venue.toUpperCase()} · SCANNED RECEIPT</Text>
        <Text style={styles.count}>
          {claimed}/{total} claimed
        </Text>
      </View>
      <MoneyText cents={totalCents} currency={currency} size={40} color={colors.white} variant="heading" />
      <ProgressBar
        progress={progress}
        style={styles.progress}
        trackColor="rgba(255,255,255,0.22)"
        fillColor={colors.white}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: 20,
    marginBottom: spacing.xl,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.85)",
    flexShrink: 1,
  },
  count: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.85)",
  },
  progress: {
    marginTop: spacing.lg,
  },
});
