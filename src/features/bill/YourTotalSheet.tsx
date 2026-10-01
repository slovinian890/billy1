import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { YOU_PARTICIPANT_ID } from "@/lib/mock/fridayDinner";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { useBillStore } from "@/store/billStore";
import { computeBillTotals } from "./selectors";

export interface YourTotalSheetHandle {
  open: () => void;
  close: () => void;
}

export const YourTotalSheet = forwardRef<YourTotalSheetHandle>(function YourTotalSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);

  const bill = useBillStore((s) => s.bill);
  const items = useBillStore((s) => s.items);
  const claims = useBillStore((s) => s.claims);
  const participants = useBillStore((s) => s.participants);
  const setParticipantDone = useBillStore((s) => s.setParticipantDone);

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.present(),
    close: () => sheetRef.current?.dismiss(),
  }));

  const myClaims = useMemo(
    () => claims.filter((c) => c.participantId === YOU_PARTICIPANT_ID),
    [claims]
  );

  const myLines = useMemo(
    () =>
      myClaims
        .map((claim) => {
          const item = items.find((i) => i.id === claim.itemId);
          if (!item) return null;
          const isShared = claims.filter((c) => c.itemId === claim.itemId).length > 1;
          return { key: claim.id, item, shareCents: claim.shareCents, isShared };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [myClaims, items, claims]
  );

  const totals = useMemo(() => computeBillTotals(bill, claims, participants), [bill, claims, participants]);
  const myTotal = totals[YOU_PARTICIPANT_ID];

  const handleDone = () => {
    setParticipantDone(YOU_PARTICIPANT_ID, true);
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      )}
    >
      <BottomSheetScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.eyebrow}>YOUR TOTAL</Text>
        <Text style={styles.title}>Here's what you had</Text>

        {myLines.length === 0 ? (
          <Text style={styles.empty}>You haven't claimed anything yet — tap an item to add it here.</Text>
        ) : (
          myLines.map(({ key, item, shareCents, isShared }) => (
            <View key={key} style={styles.line}>
              <Text style={styles.lineEmoji}>{item.emoji}</Text>
              <Text style={styles.lineName} numberOfLines={1}>
                {item.name}
                {isShared ? " (shared)" : ""}
              </Text>
              <MoneyText cents={shareCents} currency={bill.currency} size={14} />
            </View>
          ))
        )}

        {myTotal && (
          <View style={styles.breakdown}>
            <BreakdownRow label="Subtotal" cents={myTotal.itemsSubtotalCents} currency={bill.currency} />
            {myTotal.serviceCents > 0 && (
              <BreakdownRow label="Your share of service" cents={myTotal.serviceCents} currency={bill.currency} />
            )}
            {myTotal.tipCents > 0 && (
              <BreakdownRow label="Your share of tip" cents={myTotal.tipCents} currency={bill.currency} />
            )}
            {myTotal.taxCents > 0 && (
              <BreakdownRow label="Your share of tax" cents={myTotal.taxCents} currency={bill.currency} />
            )}
            {myTotal.discountCents > 0 && (
              <BreakdownRow
                label="Your share of discount"
                cents={-myTotal.discountCents}
                currency={bill.currency}
              />
            )}
            {myTotal.coveringForCents > 0 && (
              <BreakdownRow
                label="Covering a friend"
                cents={myTotal.coveringForCents}
                currency={bill.currency}
              />
            )}
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>You owe</Text>
          <MoneyText
            cents={myTotal?.totalCents ?? 0}
            currency={bill.currency}
            size={34}
            color={colors.textPrimary}
            variant="heading"
          />
        </View>

        <Button title="Done" onPress={handleDone} style={styles.doneButton} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function BreakdownRow({ label, cents, currency }: { label: string; cents: number; currency: "EUR" | "USD" | "GBP" }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <MoneyText cents={cents} currency={currency} size={13.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
  },
  handleIndicator: {
    backgroundColor: colors.cardBorder,
    width: 44,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  empty: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  lineEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  lineName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14.5,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  breakdown: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  totalRow: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  doneButton: {
    marginBottom: spacing.sm,
  },
});
