import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { Currency } from "@/types";
import { AvatarStack, type AvatarStackPerson } from "./AvatarStack";
import { MoneyText } from "./MoneyText";

interface ItemRowProps {
  emoji: string;
  name: string;
  priceCents: number;
  currency?: Currency;
  claimedBy: AvatarStackPerson[];
  onPress: () => void;
  accessibilityHint?: string;
}

export function ItemRow({
  emoji,
  name,
  priceCents,
  currency = "EUR",
  claimedBy,
  onPress,
  accessibilityHint,
}: ItemRowProps) {
  const isClaimed = claimedBy.length > 0;
  const statusLabel = isClaimed
    ? claimedBy.length === 1
      ? `Claimed by ${claimedBy[0].name}`
      : `Split ${claimedBy.length} ways`
    : "Tap to claim";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${statusLabel}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.row,
        isClaimed && styles.claimedRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.emojiBubble}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.status, isClaimed ? styles.statusClaimed : styles.statusUnclaimed]}>
          {statusLabel}
        </Text>
      </View>

      <MoneyText cents={priceCents} currency={currency} size={15} style={styles.price} />

      {isClaimed ? (
        <AvatarStack people={claimedBy} size={32} />
      ) : (
        <View style={styles.plusCircle} accessibilityElementsHidden>
          <Text style={styles.plusLabel}>+</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardWhite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  claimedRow: {
    backgroundColor: colors.claimedRowFill,
  },
  pressed: {
    opacity: 0.7,
  },
  emojiBubble: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.softPanel,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 22,
  },
  middle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  status: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
  },
  statusUnclaimed: {
    color: colors.accent,
  },
  statusClaimed: {
    color: colors.textSecondary,
  },
  price: {
    marginRight: spacing.md,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.accentHighlightBorder,
    backgroundColor: colors.accentHighlightFill,
    alignItems: "center",
    justifyContent: "center",
  },
  plusLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.accent,
    marginTop: -1,
  },
});
