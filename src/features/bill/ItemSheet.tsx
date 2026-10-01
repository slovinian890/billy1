import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

import { Button } from "@/components/Button";
import { MoneyText } from "@/components/MoneyText";
import { formatMoney } from "@/lib/money";
import { splitEqual } from "@/lib/split";
import { YOU_PARTICIPANT_ID } from "@/lib/mock/fridayDinner";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { useBillStore } from "@/store/billStore";
import { useToastStore } from "@/store/toastStore";
import { CustomSplitEditor } from "./CustomSplitEditor";
import { ParticipantPickRow } from "./ParticipantPickRow";
import { claimsForItem } from "./selectors";

export interface ItemSheetHandle {
  open: (itemId: string) => void;
}

type Mode = "summary" | "split" | "custom" | "reassign";

export const ItemSheet = forwardRef<ItemSheetHandle>(function ItemSheet(_props, ref) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("summary");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const items = useBillStore((s) => s.items);
  const participants = useBillStore((s) => s.participants);
  const claims = useBillStore((s) => s.claims);
  const currency = useBillStore((s) => s.bill.currency);
  const claimItem = useBillStore((s) => s.claimItem);
  const splitItem = useBillStore((s) => s.splitItem);
  const unclaimItem = useBillStore((s) => s.unclaimItem);
  const showToast = useToastStore((s) => s.show);

  const item = useMemo(() => items.find((i) => i.id === itemId) ?? null, [items, itemId]);
  const itemClaims = useMemo(() => (itemId ? claimsForItem(claims, itemId) : []), [claims, itemId]);

  useImperativeHandle(ref, () => ({
    open: (id: string) => {
      setItemId(id);
      setMode("summary");
      sheetRef.current?.present();
    },
  }));

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const handleClaim = useCallback(
    (participantId: string) => {
      if (!item) return;
      claimItem(item.id, participantId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      close();
    },
    [item, claimItem, close]
  );

  const enterSplitMode = useCallback(() => {
    setSelectedIds(
      itemClaims.length > 0 ? itemClaims.map((c) => c.participantId) : [YOU_PARTICIPANT_ID]
    );
    setMode("split");
  }, [itemClaims]);

  const toggleSelected = useCallback((participantId: string) => {
    setSelectedIds((prev) =>
      prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId]
    );
  }, []);

  const confirmEqualSplit = useCallback(() => {
    if (!item || selectedIds.length < 2) return;
    splitItem(item.id, selectedIds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(`Split ${selectedIds.length} ways ✦`);
    close();
  }, [item, selectedIds, splitItem, showToast, close]);

  const confirmCustomSplit = useCallback(
    (shares: Record<string, number>) => {
      if (!item) return;
      splitItem(item.id, selectedIds, shares);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showToast("Custom split saved ✦");
      close();
    },
    [item, selectedIds, splitItem, showToast, close]
  );

  const handleUnclaim = useCallback(() => {
    if (!item) return;
    unclaimItem(item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    close();
  }, [item, unclaimItem, close]);

  const splitShares = useMemo(() => {
    if (!item || selectedIds.length === 0) return {};
    return splitEqual(item.priceCents, selectedIds);
  }, [item, selectedIds]);

  const splitLabel = useMemo(() => {
    if (!item) return "Split this item";
    const values = Object.values(splitShares);
    const allEqual = values.length > 0 && values.every((v) => v === values[0]);
    return allEqual
      ? `Split for ${formatMoney(values[0], currency)} each`
      : `Split ${selectedIds.length} ways · ${formatMoney(item.priceCents, currency)}`;
  }, [item, splitShares, selectedIds.length, currency]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      onDismiss={() => setItemId(null)}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      )}
    >
      <BottomSheetView style={styles.content}>
        {item && (
          <>
            <View style={styles.header}>
              <View style={styles.emojiBubble}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <MoneyText cents={item.priceCents} currency={currency} size={16} emphasis />
              </View>
            </View>

            {mode === "summary" && (
              <SummaryView
                claimed={itemClaims.length > 0}
                owners={itemClaims}
                participants={participants}
                onClaimSelf={() => handleClaim(YOU_PARTICIPANT_ID)}
                onSplit={enterSplitMode}
                onUnclaim={handleUnclaim}
                onReassign={() => setMode("reassign")}
              />
            )}

            {mode === "split" && (
              <View>
                <Text style={styles.sectionLabel}>Who shared it?</Text>
                {participants.map((p) => (
                  <ParticipantPickRow
                    key={p.id}
                    name={p.name}
                    color={p.colour}
                    selected={selectedIds.includes(p.id)}
                    onPress={() => toggleSelected(p.id)}
                    mode="check"
                  />
                ))}
                <Button
                  title={splitLabel}
                  onPress={confirmEqualSplit}
                  disabled={selectedIds.length < 2}
                  style={styles.primaryAction}
                />
                <Button
                  title="Custom amounts"
                  variant="ghost"
                  haptic={false}
                  disabled={selectedIds.length < 1}
                  onPress={() => setMode("custom")}
                />
              </View>
            )}

            {mode === "custom" && item && (
              <CustomSplitEditor
                people={selectedIds.map((id) => {
                  const p = participants.find((participant) => participant.id === id);
                  return { id, name: p?.name ?? "Someone", color: p?.colour ?? colors.textMuted };
                })}
                itemPriceCents={item.priceCents}
                initialCents={splitShares}
                onConfirm={confirmCustomSplit}
                onCancel={() => setMode("split")}
              />
            )}

            {mode === "reassign" && (
              <View>
                <Text style={styles.sectionLabel}>Reassign to…</Text>
                {participants.map((p) => (
                  <ParticipantPickRow
                    key={p.id}
                    name={p.name}
                    color={p.colour}
                    selected={itemClaims[0]?.participantId === p.id}
                    onPress={() => handleClaim(p.id)}
                    mode="radio"
                  />
                ))}
                <Button title="Cancel" variant="ghost" haptic={false} onPress={() => setMode("summary")} />
              </View>
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

interface SummaryViewProps {
  claimed: boolean;
  owners: { participantId: string }[];
  participants: { id: string; name: string; colour: string }[];
  onClaimSelf: () => void;
  onSplit: () => void;
  onUnclaim: () => void;
  onReassign: () => void;
}

function SummaryView({ claimed, owners, participants, onClaimSelf, onSplit, onUnclaim, onReassign }: SummaryViewProps) {
  if (!claimed) {
    return (
      <View>
        <Button title="Claim this item" onPress={onClaimSelf} style={styles.primaryAction} />
        <Button title="Split this item" variant="secondary" onPress={onSplit} />
      </View>
    );
  }

  const isSplit = owners.length > 1;
  const ownerNames = owners
    .map((o) => participants.find((p) => p.id === o.participantId)?.name ?? "Someone")
    .join(", ");

  return (
    <View>
      <Text style={styles.claimedBy}>{isSplit ? `Split between ${ownerNames}` : `Claimed by ${ownerNames}`}</Text>
      {!isSplit && (
        <Button title="Reassign to someone else" variant="secondary" onPress={onReassign} style={styles.primaryAction} />
      )}
      {isSplit && <Button title="Edit split" onPress={onSplit} style={styles.primaryAction} />}
      <Button title="Unclaim" variant="ghost" onPress={onUnclaim} haptic={false} />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  emojiBubble: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.softPanel,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.headingSemiBold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sectionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  claimedBy: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  primaryAction: {
    marginBottom: spacing.sm,
  },
});
