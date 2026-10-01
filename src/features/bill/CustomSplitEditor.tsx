import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { formatMoney } from "@/lib/money";
import { isUnevenSplitValid, sumCents } from "@/lib/split";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { AvatarStackPerson } from "@/components/AvatarStack";

interface CustomSplitEditorProps {
  people: AvatarStackPerson[];
  itemPriceCents: number;
  initialCents: Record<string, number>;
  onConfirm: (shares: Record<string, number>) => void;
  onCancel: () => void;
}

/** Parses a "4.50" style euro string the person is typing into whole cents. */
function eurosToCents(text: string): number {
  const normalised = text.replace(",", ".").trim();
  if (normalised === "" || normalised === ".") return 0;
  const value = Number(normalised);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function CustomSplitEditor({
  people,
  itemPriceCents,
  initialCents,
  onConfirm,
  onCancel,
}: CustomSplitEditorProps) {
  const [text, setText] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const person of people) {
      const cents = initialCents[person.id] ?? 0;
      initial[person.id] = cents > 0 ? (cents / 100).toFixed(2) : "";
    }
    return initial;
  });

  const cents = useMemo(() => {
    const result: Record<string, number> = {};
    for (const person of people) {
      result[person.id] = eurosToCents(text[person.id] ?? "");
    }
    return result;
  }, [text, people]);

  const total = sumCents(Object.values(cents));
  const remaining = itemPriceCents - total;
  const valid = isUnevenSplitValid(Object.values(cents), itemPriceCents);

  return (
    <View>
      {people.map((person) => (
        <View key={person.id} style={styles.row}>
          <Avatar name={person.name} color={person.color} size={36} />
          <Text style={styles.name}>{person.name}</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.currencySymbol}>€</Text>
            <BottomSheetTextInput
              value={text[person.id] ?? ""}
              onChangeText={(value) => setText((prev) => ({ ...prev, [person.id]: value }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              accessibilityLabel={`${person.name}'s amount`}
            />
          </View>
        </View>
      ))}

      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, !valid && styles.summaryWarning]}>
          {valid
            ? "Adds up exactly"
            : remaining > 0
              ? `${formatMoney(remaining)} left to assign`
              : `${formatMoney(Math.abs(remaining))} over the item price`}
        </Text>
        <MoneyText cents={itemPriceCents} size={14} color={colors.textMuted} />
      </View>

      <Button
        title={`Confirm split · ${formatMoney(total)}`}
        onPress={() => onConfirm(cents)}
        disabled={!valid}
        style={styles.confirmButton}
      />
      <Button title="Back" variant="ghost" onPress={onCancel} haptic={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  name: {
    flex: 1,
    marginLeft: spacing.md,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softPanel,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    minWidth: 96,
  },
  currencySymbol: {
    fontFamily: fonts.mono,
    color: colors.textPrice,
    fontSize: 15,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.success,
  },
  summaryWarning: {
    color: colors.accentPressed,
  },
  confirmButton: {
    marginBottom: spacing.sm,
  },
});
