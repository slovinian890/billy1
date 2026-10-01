import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Card } from "./Card";
import { EyebrowTitle } from "./EyebrowTitle";

interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  emoji: string;
  note: string;
}

/** Used for tabs whose real build lands in a later phase of the plan. */
export function PlaceholderScreen({ eyebrow, title, emoji, note }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <EyebrowTitle eyebrow={eyebrow} title={title} style={styles.header} />
      <Card variant="white" style={styles.card}>
        <View style={styles.emojiBadge}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>COMING SOON</Text>
        </View>
        <Text style={styles.note}>{note}</Text>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  card: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
  },
  emojiBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.accentHighlightFill,
    borderWidth: 1.5,
    borderColor: colors.accentHighlightBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 32,
  },
  pill: {
    backgroundColor: colors.softPanel,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: spacing.md,
  },
});
